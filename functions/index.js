const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

if (!admin.apps.length) {
  admin.initializeApp();
}

// Gmail Configuration: Set these via functions/.env or replace directly below
const GMAIL_USER = (process.env.GMAIL_EMAIL || functions.config().gmail?.email || 'naresh.explores9@gmail.com').trim();
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || functions.config().gmail?.password || 'fgvagryalkuqmdsw').replace(/\s+/g, '');

/**
 * Helper to initialize Nodemailer Gmail transporter
 */
const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS
    }
  });
};

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

/**
 * 1. Background Trigger: sendWelcomeEmailOnSignUp
 * Automatically fires whenever a new user registers or signs up in Firebase Authentication.
 */
exports.sendWelcomeEmailOnSignUp = functions.auth.user().onCreate(async (user) => {
  const email = user.email;
  if (!email) {
    console.log('No email found for newly created user UID:', user.uid);
    return null;
  }

  // Check if Gmail credentials are provided
  if (!GMAIL_USER || !GMAIL_PASS) {
    console.warn('⚠️ [sendWelcomeEmailOnSignUp] Gmail credentials not configured. Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD.');
    return null;
  }

  const displayName = user.displayName || email.split('@')[0] || 'User';
  const registrationDate = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const mailOptions = {
    from: `"VillagePulse Portal" <${GMAIL_USER}>`,
    to: email,
    subject: '🎉 Welcome to VillagePulse - Registration Successful!',
    text: `नमस्ते ${displayName},\n\nVillagePulse पोर्टल पर आपका खाता सफलतापूर्वक बन चुका है।\nEmail: ${email}\nDate: ${registrationDate}\n\nअब आप पोर्टल पर लॉगिन करके ग्राम सर्वेक्षण कार्य शुरू कर सकते हैं।\n\nVillagePulse Team`,
    html: `
      <div style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #15803d 0%, #4338ca 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">VillagePulse</h1>
              <p style="color: #dcfce7; margin: 6px 0 0; font-size: 14px; font-weight: 500;">ग्राम सर्वेक्षण प्रबंधन एवं विश्लेषण पोर्टल</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="color: #111827; margin: 0 0 12px; font-size: 20px; font-weight: 600;">
                नमस्ते ${displayName}, स्वागत है! 👋
              </h2>
              <p style="margin: 0 0 18px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                VillagePulse पोर्टल पर आपका खाता <strong>सफलतापूर्वक रजिस्टर</strong> हो गया है। आपका विवरण नीचे दिया गया है:
              </p>

              <!-- Registration Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 22px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 140px;">Registered Email:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 600;">Account Status:</td>
                  <td style="padding: 6px 0; color: #16a34a; font-size: 14px; font-weight: 700;">Active (सक्रिय)</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 600;">Registered At:</td>
                  <td style="padding: 6px 0; color: #334155; font-size: 13px;">${registrationDate} IST</td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; color: #4b5563; font-size: 14px; line-height: 1.6;">
                यदि आपको किसी गाँव या सर्वे का कार्यभार दिया जाता है, तो वह आपके लॉगिन डैशबोर्ड में स्वतः दिखाई देने लगेगा।
              </p>

              <!-- Footer CTA -->
              <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px; font-size: 13px; color: #94a3b8;">
                <p style="margin: 0;">सुरक्षा सुझाव: अपना लॉगिन पासवर्ड कभी किसी के साथ साझा न करें।</p>
              </div>
            </td>
          </tr>

          <!-- Email Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} VillagePulse Survey System. All rights reserved.
            </td>
          </tr>
        </table>
      </div>
    `
  };

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error);
    return { success: false, error: error.message };
  }
});

/**
 * 2. Callable Cloud Function: sendLoginAlert
 * Optional security alert sent when a user logs in.
 */
exports.sendLoginAlert = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const email = context.auth.token.email;
  if (!email) {
    return { success: false, message: 'No email associated with account' };
  }

  // Check if Gmail credentials are provided
  if (!GMAIL_USER || !GMAIL_PASS) {
    console.warn('⚠️ [sendLoginAlert] Gmail credentials not configured.');
    return { success: false, message: 'Gmail credentials not configured' };
  }

  const displayName = context.auth.token.name || email.split('@')[0] || 'User';
  const loginDate = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const mailOptions = {
    from: `"VillagePulse Security" <${GMAIL_USER}>`,
    to: email,
    subject: '🔐 VillagePulse: New Login Detected',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 580px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #1e293b; padding: 20px; text-align: center; color: #fff;">
          <h2 style="margin: 0; font-size: 20px;">VillagePulse Security Alert</h2>
        </div>
        <div style="padding: 24px;">
          <p>नमस्ते <strong>${displayName}</strong>,</p>
          <p>आपके VillagePulse खाते में नया लॉगिन दर्ज किया गया है:</p>
          <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Time:</strong> ${loginDate} IST</p>
            <p style="margin: 4px 0;"><strong>Account:</strong> ${email}</p>
          </div>
          <p style="color: #64748b; font-size: 13px;">यदि यह आप थे, तो आपको कुछ करने की आवश्यकता नहीं है। यदि आपने यह लॉगिन नहीं किया था, तो कृपया तुरंत अपना पासवर्ड बदलें।</p>
        </div>
        <div style="background: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b;">
          VillagePulse &copy; ${new Date().getFullYear()}
        </div>
      </div>
    `
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending login alert:', error);
    return { success: false, error: error.message };
  }
});
