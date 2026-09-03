const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

/**
 * Dispatches an email via Brevo HTTPS REST API (Port 443 - 100% Render compatible).
 * Free tier: 300 emails/day forever to ANY recipient without domain verification.
 */
const sendViaBrevoApi = async ({ to, subject, html, text }) => {
  const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  if (!apiKey) return null;

  try {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'security@cloudshield.internal';
    const senderName = process.env.BREVO_SENDER_NAME || 'CloudShield Security';

    logger.info(`Brevo HTTPS API: Dispatching email to ${to} from ${senderEmail}...`);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey.trim(),
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Brevo HTTP ${response.status}`);
    }

    logger.info(`Brevo HTTPS API: Successfully delivered email to ${to} (Message ID: ${data.messageId})`);
    return { success: true, messageId: data.messageId, provider: 'Brevo HTTPS REST API (Port 443)' };
  } catch (err) {
    logger.error(`Brevo HTTPS API Error for ${to}: ${err.message}`);
    return null;
  }
};

/**
 * Dispatches an email via Resend HTTPS REST API (Port 443).
 * If Resend returns a sandbox restriction, safely delivers to the registered account email.
 */
const sendViaResendApi = async ({ to, subject, html, text }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn('EmailService: RESEND_API_KEY is not set in environment variables.');
    return null;
  }

  const fromAddress = process.env.RESEND_FROM || 'CloudShield Security <onboarding@resend.dev>';

  try {
    logger.info(`Resend HTTPS API: Dispatching email strictly to user (${to}) from ${fromAddress}...`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const errMsg = data.message || data.error?.message || `Resend API HTTP ${response.status}`;
      logger.warn(`Resend HTTPS API: Could not deliver to ${to} (${errMsg})`);
      return { success: false, error: errMsg, statusCode: response.status };
    }

    logger.info(`Resend HTTPS API: Successfully delivered email to user ${to} (Message ID: ${data.id})`);
    return { success: true, messageId: data.id, provider: 'Resend HTTPS API' };
  } catch (err) {
    logger.error(`Resend HTTPS API Exception for ${to}: ${err.message}`);
    return null;
  }
};

/**
 * Initializes or retrieves the Nodemailer transporter instance with fast timeouts for Render compatibility.
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST;

  if (smtpHost && emailUser && emailPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: emailUser.trim(),
        pass: emailPass.trim().replace(/\s+/g, ''),
      },
      connectionTimeout: 3000,
      greetingTimeout: 3000,
      socketTimeout: 4000,
      tls: {
        rejectUnauthorized: false,
      },
    });
    logger.info(`Nodemailer: Connected via Custom SMTP (${smtpHost}) with Sender Admin: ${emailUser.trim()}`);
  } else if (emailUser && emailPass) {
    const cleanUser = emailUser.trim();
    const cleanPass = emailPass.trim().replace(/\s+/g, '');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      connectionTimeout: 3000,
      greetingTimeout: 3000,
      socketTimeout: 4000,
    });
    logger.info(`Nodemailer: Connected via Admin Gmail Sender (${cleanUser})`);
  } else {
    logger.warn('Nodemailer: No EMAIL_USER/EMAIL_PASS configured. Initializing fallback mode...');
    transporter = {
      sendMail: async (mailOptions) => {
        logger.info(`[CLOUD-SHIELD FALLBACK LOG] To: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
        return { messageId: 'simulated-' + Date.now(), simulated: true };
      },
    };
  }

  return transporter;
};

/**
 * Builds official corporate HTML email for employee Zero-Trust verification.
 */
const buildCorporateOtpHtml = ({ user, resource, otp, title, description, deviceInfo = {}, locationInfo = {} }) => {
  const resourceName = resource?.name || title || 'Protected Corporate Resource';
  const category = resource?.category || 'Enterprise Digital Asset';
  const sensitivity = resource?.sensitivity || 'Confidential';
  const userName = user?.fullName || 'Valued Employee';
  const userEmail = user?.email || 'user@company.com';
  const ip = deviceInfo.ip || '192.168.1.10';
  const device = deviceInfo.deviceName || 'Authorized Enterprise Workstation';
  const location = locationInfo.city && locationInfo.country ? `${locationInfo.city}, ${locationInfo.country}` : 'Enterprise Network';
  const timestamp = new Date().toUTCString();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CloudShield Security Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .wrapper {
      width: 100%;
      background-color: #0b1120;
      padding: 32px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6);
    }
    .header {
      background: linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%);
      padding: 26px 24px;
      text-align: center;
      color: #ffffff;
      border-bottom: 2px solid #3b82f6;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      letter-spacing: 0.5px;
      font-weight: 800;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #93c5fd;
    }
    .content {
      padding: 28px 26px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 14px;
      color: #f8fafc;
    }
    .company-notice {
      background-color: #0f172a;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
      padding: 14px 16px;
      font-size: 13.5px;
      line-height: 1.55;
      color: #cbd5e1;
      margin-bottom: 22px;
    }
    .resource-card {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 22px;
    }
    .resource-title {
      font-size: 15px;
      font-weight: 700;
      color: #38bdf8;
      margin: 0 0 4px 0;
    }
    .resource-meta {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
    }
    .otp-container {
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
      border: 2px dashed #38bdf8;
      border-radius: 12px;
      padding: 24px 20px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-heading {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #93c5fd;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .otp-value {
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #ffffff;
      font-family: 'Courier New', Courier, monospace;
      padding: 4px 0;
      text-shadow: 0 0 16px rgba(56, 189, 248, 0.4);
    }
    .otp-timer {
      font-size: 12px;
      color: #fbbf24;
      margin-top: 10px;
      font-weight: 600;
    }
    .audit-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 22px;
      font-size: 12.5px;
      background-color: #0f172a;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #334155;
    }
    .audit-table td {
      padding: 8px 12px;
      color: #94a3b8;
      border-bottom: 1px solid #1e293b;
    }
    .audit-table td.col-label {
      font-weight: 600;
      color: #cbd5e1;
      width: 38%;
    }
    .security-notice {
      background-color: #291515;
      border: 1px solid #991b1b;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #fca5a5;
      margin-top: 22px;
      line-height: 1.45;
    }
    .footer {
      background-color: #0b1120;
      padding: 18px 24px;
      text-align: center;
      font-size: 11.5px;
      color: #64748b;
      border-top: 1px solid #1e293b;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>🛡️ CloudShield Enterprise Zero Trust</h1>
        <p>Official Employee Access Verification</p>
      </div>
      <div class="content">
        <div class="greeting">Hello <strong>${userName}</strong>,</div>
        
        <div class="company-notice">
          <strong>🏢 Company Security Advisory:</strong> An access request has been initiated for your user account (<b>${userEmail}</b>). 
          Under corporate Zero-Trust compliance guidelines, please enter the one-time authentication code below into your active session to verify your identity.
        </div>

        <div class="resource-card">
          <div class="resource-title">📂 ${resourceName}</div>
          <p class="resource-meta">Asset Classification: <b>${sensitivity}</b> • Category: <b>${category}</b></p>
        </div>

        <div class="otp-container">
          <div class="otp-heading">Your Enterprise Verification Passcode</div>
          <div class="otp-value">${otp}</div>
          <div class="otp-timer">⏱️ Code valid for 10 minutes (Single use only)</div>
        </div>

        <table class="audit-table">
          <tr>
            <td class="col-label">Recipient Account:</td>
            <td><strong>${userEmail}</strong></td>
          </tr>
          <tr>
            <td class="col-label">Security Timestamp:</td>
            <td>${timestamp}</td>
          </tr>
          <tr>
            <td class="col-label">Originating IP:</td>
            <td>${ip}</td>
          </tr>
          <tr>
            <td class="col-label">Location:</td>
            <td>${location}</td>
          </tr>
          <tr>
            <td class="col-label">Device Client:</td>
            <td>${device}</td>
          </tr>
        </table>

        <div class="security-notice">
          <strong>⚠️ Confidentiality Notice:</strong> Do not disclose or forward this verification code to anyone, including internal IT staff. 
          If you did not initiate this authorization request, report this immediately to the IT Security & Operations Center.
        </div>
      </div>
      <div class="footer">
        © CloudShield Enterprise Security Gateway • Automated Security Notification<br>
        This email was dispatched to <b>${userEmail}</b>. Please do not reply directly to this automated email.
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

const emailService = {
  /**
   * Sends 6-digit MFA OTP email exclusively to the user's account for document/resource access.
   * Dispatches via Brevo HTTPS -> Resend HTTPS -> Admin Gmail SMTP.
   */
  sendDocumentAccessOtp: async ({ user, resource, otp, deviceInfo = {}, locationInfo = {} }) => {
    const recipientEmail = (user?.email || '').trim();

    if (!recipientEmail || !recipientEmail.includes('@')) {
      logger.error(`EmailService: Invalid recipient email address: ${recipientEmail}`);
      return { success: false, error: 'Invalid user email address' };
    }

    const subject = `🔐 CloudShield Security OTP: ${otp} - Accessing ${resource?.name || 'Document'}`;
    const html = buildCorporateOtpHtml({
      user,
      resource,
      otp,
      title: resource?.name,
      description: 'Document Access Verification',
      deviceInfo,
      locationInfo,
    });
    const text = `CloudShield Enterprise Verification OTP: ${otp}\n\nHello ${user?.fullName || 'User'},\n\nA request was initiated to access "${resource?.name || 'Corporate Document'}".\nYour verification code is: ${otp}\n\nThis OTP was dispatched to your account: ${recipientEmail}\nValid for 10 minutes.`;

    // 1. Try Brevo HTTPS REST API (Port 443 - 100% Render compatible)
    if (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY) {
      const brevoResult = await sendViaBrevoApi({ to: recipientEmail, subject, html, text });
      if (brevoResult?.success) {
        return { success: true, messageId: brevoResult.messageId, provider: brevoResult.provider };
      }
    }

    // 2. Try Resend HTTPS REST API (Port 443 - 100% Render compatible)
    if (process.env.RESEND_API_KEY) {
      const resendResult = await sendViaResendApi({ to: recipientEmail, subject, html, text });
      if (resendResult?.success) {
        return { success: true, messageId: resendResult.messageId, provider: resendResult.provider };
      }
    }

    // 3. Try Admin Gmail SMTP (fast 3s timeout)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const activeTransporter = await getTransporter();
        const fromAddress = process.env.SMTP_FROM || `"CloudShield Security" <${process.env.EMAIL_USER.trim()}>`;

        logger.info(`EmailService: Dispatching document access OTP from Admin (${process.env.EMAIL_USER}) to user (${recipientEmail})...`);

        const info = await activeTransporter.sendMail({
          from: fromAddress,
          to: recipientEmail,
          subject,
          text,
          html,
        });

        logger.info(`EmailService: Successfully delivered document OTP to user ${recipientEmail} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, provider: 'Admin Gmail SMTP' };
      } catch (smtpErr) {
        logger.warn(`EmailService: Gmail SMTP dispatch to ${recipientEmail} failed (${smtpErr.message}).`);
      }
    }

    logger.warn(`EmailService: Could not dispatch OTP to ${recipientEmail}. Please verify SMTP credentials or Resend/Brevo API key.`);
    return { success: false, error: 'Email delivery failed' };
  },

  /**
   * Sends 6-digit MFA OTP email exclusively to the user's account for login/session MFA verification.
   * Dispatches via Brevo HTTPS -> Resend HTTPS -> Admin Gmail SMTP.
   */
  sendMfaSecurityOtp: async ({ user, otp, title = 'Security Verification', description = 'Account Authentication Challenge' }) => {
    const recipientEmail = (user?.email || '').trim();

    if (!recipientEmail || !recipientEmail.includes('@')) {
      logger.error(`EmailService: Invalid recipient email address: ${recipientEmail}`);
      return { success: false, error: 'Invalid user email address' };
    }

    const subject = `🔐 CloudShield Security Passcode: ${otp} - ${title}`;
    const html = buildCorporateOtpHtml({
      user,
      resource: { name: title, category: 'Account Security', sensitivity: 'High' },
      otp,
      title,
      description,
    });
    const text = `CloudShield Enterprise Security Passcode: ${otp}\n\nHello ${user?.fullName || 'User'},\n\nAn identity challenge was triggered for your user account (${recipientEmail}).\nYour 6-digit verification passcode is: ${otp}\n\nValid for 10 minutes.`;

    // 1. Try Brevo HTTPS REST API (Port 443 - 100% Render compatible)
    if (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY) {
      const brevoResult = await sendViaBrevoApi({ to: recipientEmail, subject, html, text });
      if (brevoResult?.success) {
        return { success: true, messageId: brevoResult.messageId, provider: brevoResult.provider };
      }
    }

    // 2. Try Resend HTTPS REST API (Port 443 - 100% Render compatible)
    if (process.env.RESEND_API_KEY) {
      const resendResult = await sendViaResendApi({ to: recipientEmail, subject, html, text });
      if (resendResult?.success) {
        return { success: true, messageId: resendResult.messageId, provider: resendResult.provider };
      }
    }

    // 3. Try Admin Gmail SMTP (fast 3s timeout)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const activeTransporter = await getTransporter();
        const fromAddress = process.env.SMTP_FROM || `"CloudShield Security" <${process.env.EMAIL_USER.trim()}>`;

        logger.info(`EmailService: Dispatching MFA OTP from Admin (${process.env.EMAIL_USER}) to user (${recipientEmail})...`);

        const info = await activeTransporter.sendMail({
          from: fromAddress,
          to: recipientEmail,
          subject,
          text,
          html,
        });

        logger.info(`EmailService: Successfully delivered MFA OTP to user ${recipientEmail} (Message ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId, provider: 'Admin Gmail SMTP' };
      } catch (smtpErr) {
        logger.warn(`EmailService: Gmail SMTP dispatch to ${recipientEmail} failed (${smtpErr.message}).`);
      }
    }

    logger.warn(`EmailService: Could not dispatch MFA OTP to ${recipientEmail}. Please verify SMTP credentials or Resend/Brevo API key.`);
    return { success: false, error: 'Email delivery failed' };
  },
};

module.exports = emailService;
