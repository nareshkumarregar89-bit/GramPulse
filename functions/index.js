const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const SUPER_ADMIN_UID = 'sJwiZZ6cf8Ze8YAmMMK8T1FwF232';

/**
 * Callable Cloud Function: deleteUserByAdmin
 * Deletes user from Firebase Auth and cleans up Firestore profile
 */
exports.deleteUserByAdmin = functions.https.onCall(async (data, context) => {
  // 1. Verify Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const callerUid = context.auth.uid;
  let isCallerAdmin = callerUid === SUPER_ADMIN_UID;

  if (!isCallerAdmin) {
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    if (callerDoc.exists && callerDoc.data().role === 'admin') {
      isCallerAdmin = true;
    }
  }

  if (!isCallerAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only administrators can delete user accounts.');
  }

  const { targetUid, userData } = data;
  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUid is required.');
  }

  if (targetUid === callerUid) {
    throw new functions.https.HttpsError('failed-precondition', 'You cannot delete your own account.');
  }

  if (targetUid === SUPER_ADMIN_UID) {
    throw new functions.https.HttpsError('permission-denied', 'Super Admin account is protected.');
  }

  // Check last active admin
  const adminsSnap = await admin.firestore().collection('users').where('role', '==', 'admin').get();
  const activeAdmins = adminsSnap.docs.filter(d => {
    const docData = d.data();
    return !docData.isDeleted && docData.status !== 'inactive' && docData.status !== 'deleted';
  });

  if (activeAdmins.length <= 1 && activeAdmins.some(d => d.id === targetUid)) {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot delete the last active administrator.');
  }

  // Revoke tokens and delete from Firebase Auth
  let authDeleted = false;
  try {
    await admin.auth().revokeRefreshTokens(targetUid);
    await admin.auth().deleteUser(targetUid);
    authDeleted = true;
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      authDeleted = true;
    } else {
      console.warn('Auth deletion warning in Cloud Function:', err.message);
    }
  }

  const now = new Date().toISOString();

  // Safely update user profile in Firestore
  await admin.firestore().collection('users').doc(targetUid).set({
    status: 'deleted',
    isDeleted: true,
    authDeleted,
    assignedVillages: [],
    assignedVillageId: null,
    assignmentStatus: 'Unassigned',
    deletedAt: now,
    deletedBy: callerUid
  }, { merge: true });

  // Record audit log
  try {
    await admin.firestore().collection('adminAuditLogs').add({
      action: 'DELETE_USER',
      targetUid,
      targetEmail: userData?.email || '',
      targetName: userData?.name || '',
      performedBy: callerUid,
      authDeleted,
      timestamp: now
    });
  } catch (auditErr) {
    console.warn('Audit log write error:', auditErr.message);
  }

  return {
    success: true,
    authDeleted,
    message: authDeleted
      ? 'User account permanently removed from Firebase Authentication.'
      : 'User marked deleted in database.'
  };
});
