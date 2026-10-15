/**
 * Serverless API Route: Delete User from Firebase Authentication and Firestore
 * Supported environments: Vercel Serverless Functions, Netlify Functions, Node.js
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || 'gram-survey'
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'gram-survey'
      });
    } else {
      // Initialize with default project config if running inside Google Cloud / Firebase environment
      admin.initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'gram-survey'
      });
    }
  } catch (initErr) {
    console.warn('Firebase Admin SDK initialization note:', initErr.message);
  }
}

const SUPER_ADMIN_UID = 'sJwiZZ6cf8Ze8YAmMMK8T1FwF232';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // 1. Verify Caller Authentication
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header.' });
    }

    const idToken = authHeader.split('Bearer ')[1].trim();
    let callerUid = null;
    let isCallerAdmin = false;

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      callerUid = decodedToken.uid;
      
      // Check if caller is Super Admin
      if (callerUid === SUPER_ADMIN_UID) {
        isCallerAdmin = true;
      } else {
        // Verify admin role in Firestore
        const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
        if (callerDoc.exists && callerDoc.data().role === 'admin') {
          isCallerAdmin = true;
        }
      }
    } catch (authVerifyErr) {
      console.error('Caller token verification failed:', authVerifyErr.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid authentication token.' });
    }

    if (!isCallerAdmin) {
      return res.status(403).json({ error: 'Forbidden: Only administrators can delete user accounts.' });
    }

    // 2. Validate Target User UID
    const { targetUid, userData } = req.body || {};
    if (!targetUid || typeof targetUid !== 'string') {
      return res.status(400).json({ error: 'Bad Request: targetUid is required.' });
    }

    // Safeguard A: Cannot delete self
    if (targetUid === callerUid) {
      return res.status(400).json({ error: 'Bad Request: You cannot delete your own administrator account.' });
    }

    // Safeguard B: Cannot delete Super Admin
    if (targetUid === SUPER_ADMIN_UID) {
      return res.status(403).json({ error: 'Forbidden: Super Admin account is protected and cannot be deleted.' });
    }

    // Safeguard C: Cannot delete last active admin
    const adminsSnap = await admin.firestore().collection('users')
      .where('role', '==', 'admin')
      .get();
    
    const activeAdmins = adminsSnap.docs.filter(d => {
      const data = d.data();
      return !data.isDeleted && data.status !== 'inactive' && data.status !== 'deleted';
    });

    if (activeAdmins.length <= 1 && activeAdmins.some(d => d.id === targetUid)) {
      return res.status(400).json({ error: 'Bad Request: Cannot delete the last active administrator.' });
    }

    // 3. Complete Firebase Authentication Deletion
    let authDeleted = false;
    try {
      // First revoke refresh tokens to immediately invalidate sessions
      await admin.auth().revokeRefreshTokens(targetUid);
      // Delete the Firebase Authentication user account completely
      await admin.auth().deleteUser(targetUid);
      authDeleted = true;
    } catch (authDelErr) {
      if (authDelErr.code === 'auth/user-not-found') {
        // User already deleted from Auth
        authDeleted = true;
      } else {
        console.warn('Firebase Auth deleteUser warning:', authDelErr.message);
      }
    }

    // 4. Completely remove user document from Firestore (Hard Delete)
    const userDocRef = admin.firestore().collection('users').doc(targetUid);
    const now = new Date().toISOString();

    await userDocRef.delete();

    // Also remove from legacy deletedUsers if exists
    try {
      await admin.firestore().collection('deletedUsers').doc(targetUid).delete();
    } catch (e) {}

    // 5. Record Protected Administrative Audit Log
    try {
      await admin.firestore().collection('adminAuditLogs').add({
        action: 'DELETE_USER',
        targetUid,
        targetEmail: userData?.email || '',
        targetName: userData?.name || '',
        targetRole: userData?.role || 'surveyor',
        performedBy: callerUid,
        authDeleted,
        timestamp: now
      });
    } catch (auditErr) {
      console.warn('Audit log write error:', auditErr.message);
    }

    // 6. Return Success Response
    return res.status(200).json({
      success: true,
      message: authDeleted 
        ? 'User account permanently removed from Firebase Authentication and database.'
        : 'User profile deactivated and access revoked in database.',
      targetUid,
      authDeleted
    });

  } catch (error) {
    console.error('Unhandled delete-user error:', error);
    return res.status(500).json({
      error: 'Internal Server Error: ' + (error.message || 'Unknown error occurred.')
    });
  }
}
