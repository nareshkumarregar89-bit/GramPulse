import emailjs from '@emailjs/browser';

// EmailJS Configuration
// These can be set via .env (VITE_EMAILJS_SERVICE_ID, etc.) or will fall back to configured values
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_88w6fxp';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_p3crlw9';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'f7bQ12tqvPpBtH2FD';

/**
 * Sends a welcome email upon successful user registration
 * @param {Object} params
 * @param {string} params.to_email - Recipient's email address
 * @param {string} params.to_name - Recipient's display name
 * @param {string} [params.role] - User role (surveyor, admin, etc.)
 */
export async function sendRegistrationWelcomeEmail({ to_email, to_name, role = 'surveyor' }) {
  if (!to_email) {
    console.warn('[emailNotifier] No recipient email specified.');
    return { success: false, error: 'No email' };
  }

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('[emailNotifier] EmailJS credentials not set yet. Waiting for configuration.');
    return { success: false, error: 'EmailJS credentials missing' };
  }

  const now = new Date();
  const regDate = now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) + ' IST';

  const templateParams = {
    to_email: to_email.trim(),
    to_name: (to_name || to_email.split('@')[0] || 'User').trim(),
    user_role: role === 'admin' ? 'Administrator' : 'Surveyor',
    reg_date: regDate
  };

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log(`✅ Welcome email sent successfully to ${to_email}:`, response.status, response.text);
    return { success: true, response };
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${to_email}:`, error);
    return { success: false, error };
  }
}
