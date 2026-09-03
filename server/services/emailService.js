const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

/**
 * Dispatches an email via Resend HTTPS REST API (Port 443 - 100% Render compatible).
 */
const sendViaResendApi = async ({ to, subject, html, text }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  try {
    const fromAddress = process.env.RESEND_FROM || process.env.SMTP_FROM || 'CloudShield Security <onboarding@resend.dev>';
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
      throw new Error(data.message || `Resend API HTTP ${response.status}`);
    }

    logger.info(`Resend HTTPS API: Dispatched email to ${to} (ID: ${data.id})`);
    return { success: true, messageId: data.id, provider: 'Resend HTTPS API (Port 443)' };
  } catch (err) {
    logger.error(`Resend HTTPS API failed: ${err.message}`);
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
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000,
      tls: {
        rejectUnauthorized: false,
      },
    });
    logger.info(`Nodemailer: Connected via Custom SMTP (${smtpHost}) for ${emailUser.trim()}`);
  } else if (emailUser && emailPass) {
    // Gmail Direct SSL Transport (Port 465) with fast timeout
    const cleanUser = emailUser.trim();
    const cleanPass = emailPass.trim().replace(/\s+/g, '');
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000,
      tls: {
        rejectUnauthorized: false,
      },
    });
    logger.info(`Nodemailer: Connected via Gmail Direct SSL (smtp.gmail.com:465) for ${cleanUser}`);
  } else {
    // Generate Nodemailer Ethereal SMTP test transporter or simulated fallback
    logger.warn('Nodemailer: No EMAIL_USER/EMAIL_PASS in .env. Initializing in-app test delivery mode...');
    transporter = {
      sendMail: async (mailOptions) => {
        logger.info(`[CLOUD-SHIELD IN-APP/SIMULATED] To: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
        return { messageId: 'simulated-' + Date.now(), simulated: true };
      },
    };
  }

  return transporter;
};

/**
 * Generates modern styled HTML email for MFA Document Access OTP verification.
 */
const buildDocumentOtpHtml = ({ user, resource, otp, deviceInfo = {}, locationInfo = {} }) => {
  const resourceName = resource?.name || 'Protected Enterprise Document';
  const category = resource?.category || 'Business Asset';
  const sensitivity = resource?.sensitivity || 'Medium';
  const userName = user?.fullName || 'CloudShield User';
  const userEmail = user?.email || 'registered user';
  const ip = deviceInfo.ip || '192.168.1.10';
  const device = deviceInfo.deviceName || 'Authorized Browser Session';
  const location = locationInfo.city && locationInfo.country ? `${locationInfo.city}, ${locationInfo.country}` : 'India';
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
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .wrapper {
      width: 100%;
      background-color: #0f172a;
      padding: 30px 15px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      padding: 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      letter-spacing: 0.5px;
      font-weight: 700;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
    }
    .content {
      padding: 28px 24px;
    }
    .greeting {
      font-size: 15px;
      margin-bottom: 16px;
      color: #f1f5f9;
    }
    .notice {
      font-size: 14px;
      line-height: 1.5;
      color: #94a3b8;
      margin-bottom: 20px;
    }
    .doc-card {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
    }
    .doc-title {
      font-size: 15px;
      font-weight: 700;
      color: #38bdf8;
      margin: 0 0 6px 0;
    }
    .doc-meta {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
    }
    .otp-card {
      background: linear-gradient(135deg, #1e1b4b 0%, #172554 100%);
      border: 1px dashed #60a5fa;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #93c5fd;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .otp-code {
      font-size: 34px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #ffffff;
      font-family: 'Courier New', Courier, monospace;
      padding: 6px 0;
    }
    .otp-expiry {
      font-size: 12px;
      color: #f59e0b;
      margin-top: 8px;
      font-weight: 500;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 12px;
    }
    .meta-table td {
      padding: 6px 8px;
      color: #94a3b8;
      border-bottom: 1px solid #1e293b;
    }
    .meta-table td.label {
      font-weight: 600;
      color: #cbd5e1;
      width: 35%;
    }
    .security-warning {
      background-color: #291515;
      border: 1px solid #7f1d1d;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #fca5a5;
      margin-top: 24px;
      line-height: 1.4;
    }
    .footer {
      background-color: #0b1120;
      padding: 16px 24px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid #1e293b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>🛡️ CloudShield Zero Trust Defense</h1>
        <p>Document Access Verification (MFA Challenge)</p>
      </div>
      <div class="content">
        <div class="greeting">Hello, <strong>${userName}</strong>,</div>
        <p class="notice">
          A request was initiated to access a secured document on the CloudShield platform. 
          Use the one-time password (OTP) below to authenticate your identity and unlock document access.
        </p>

        <div class="doc-card">
          <div class="doc-title">📄 ${resourceName}</div>
          <p class="doc-meta">Category: <b>${category}</b> • Classification: <b>${sensitivity}</b></p>
        </div>

        <div class="otp-card">
          <div class="otp-label">Your Document Access Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-expiry">⏱️ Valid for 10 minutes (Single use only)</div>
        </div>

        <table class="meta-table">
          <tr>
            <td class="label">Target Email:</td>
            <td>${userEmail}</td>
          </tr>
          <tr>
            <td class="label">Requested At:</td>
            <td>${timestamp}</td>
          </tr>
          <tr>
            <td class="label">IP Address:</td>
            <td>${ip}</td>
          </tr>
          <tr>
            <td class="label">Location:</td>
            <td>${location}</td>
          </tr>
          <tr>
            <td class="label">Device:</td>
            <td>${device}</td>
          </tr>
        </table>

        <div class="security-warning">
          <strong>⚠️ Security Advisory:</strong> Never share this OTP with anyone, including IT support. 
          If you did not make this request, your credentials may be compromised. Please notify your Security Operations Team immediately.
        </div>
      </div>
      <div class="footer">
        CloudShield Zero-Trust Access Gateway • Continuous Verification Architecture
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

const emailService = {
  /**
   * Sends 6-digit MFA OTP email to the user's registered email address for document access.
   */
  sendDocumentAccessOtp: async ({ user, resource, otp, deviceInfo = {}, locationInfo = {} }) => {
    let recipientEmail = user.email;
    if (
      (user.email.endsWith('@company.com') || user.email.endsWith('@example.com')) &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_USER.includes('@')
    ) {
      recipientEmail = process.env.EMAIL_USER;
      logger.info(`EmailService: Demo account ${user.email} detected -> Delivering real OTP email to configured inbox: ${recipientEmail}`);
    }

    const subject = `🔐 CloudShield Security OTP: ${otp} - Document Access (${resource?.name || 'Document'})`;
    const html = buildDocumentOtpHtml({ user: { ...user, email: recipientEmail }, resource, otp, deviceInfo, locationInfo });
    const text = `CloudShield Document Access OTP: ${otp}\n\nYou have requested access to "${resource?.name || 'Protected Document'}".\nThis OTP is valid for 10 minutes.\n\nTarget Email: ${recipientEmail}\nIf you did not request this, please contact your security administrator.`;

    // 1. Try Resend HTTPS API if RESEND_API_KEY is available (Standard Port 443 - 100% Render compatible)
    if (process.env.RESEND_API_KEY) {
      const resendResult = await sendViaResendApi({ to: recipientEmail, subject, html, text });
      if (resendResult?.success) {
        return { success: true, messageId: resendResult.messageId, provider: resendResult.provider, inAppOtp: otp };
      }
    }

    // 2. Try Nodemailer SMTP (with fast timeout)
    try {
      const activeTransporter = await getTransporter();
      const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_USER || '"CloudShield Security" <security@cloudshield.internal>';

      const info = await activeTransporter.sendMail({
        from: fromAddress,
        to: recipientEmail,
        subject,
        text,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`Nodemailer Ethereal Delivery Link (Open to View Email): ${previewUrl}`);
      }

      logger.info(`EmailService: Successfully dispatched document access OTP to ${recipientEmail} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, simulated: !process.env.EMAIL_USER, previewUrl, inAppOtp: otp };
    } catch (err) {
      logger.warn(`EmailService: SMTP dispatch to ${user.email} not reachable (${err.message}). In-app Zero-Trust delivery active.`);
      logger.info(`[ZERO-TRUST IN-APP OTP] Document MFA OTP for ${user.email}: ${otp}`);
      return { success: false, error: err.message, inAppOtp: otp, fallbackLogged: true };
    }
  },

  /**
   * Sends 6-digit MFA OTP email for Account MFA Setup or Login Challenge.
   */
  sendMfaSecurityOtp: async ({ user, otp, title = 'Security Verification', description = 'Account Authentication Challenge' }) => {
    let recipientEmail = user.email;
    if (
      (user.email.endsWith('@company.com') || user.email.endsWith('@example.com')) &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_USER.includes('@')
    ) {
      recipientEmail = process.env.EMAIL_USER;
      logger.info(`EmailService: Demo account ${user.email} detected -> Delivering real OTP email to configured inbox: ${recipientEmail}`);
    }

    const subject = `🔐 CloudShield MFA Code: ${otp} - ${title}`;
    const text = `CloudShield Security Verification OTP: ${otp}\n\n${description}\nThis code is valid for 10 minutes.\n\nTarget Email: ${recipientEmail}`;
    const html = buildDocumentOtpHtml({
      user: { ...user, email: recipientEmail },
      resource: { name: title, category: 'Account Security', sensitivity: 'Critical' },
      otp,
    });

    // 1. Try Resend HTTPS API if configured
    if (process.env.RESEND_API_KEY) {
      const resendResult = await sendViaResendApi({ to: recipientEmail, subject, html, text });
      if (resendResult?.success) {
        return { success: true, messageId: resendResult.messageId, provider: resendResult.provider, inAppOtp: otp };
      }
    }

    // 2. Try Nodemailer SMTP (with fast timeout)
    try {
      const activeTransporter = await getTransporter();
      const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_USER || '"CloudShield Security" <security@cloudshield.internal>';

      const info = await activeTransporter.sendMail({
        from: fromAddress,
        to: recipientEmail,
        subject,
        text,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`Nodemailer Ethereal Delivery Link (Open to View Email): ${previewUrl}`);
      }

      logger.info(`EmailService: Successfully dispatched MFA Security OTP to ${recipientEmail} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, simulated: !process.env.EMAIL_USER, previewUrl, inAppOtp: otp };
    } catch (err) {
      logger.warn(`EmailService: SMTP dispatch to ${user.email} not reachable (${err.message}). In-app Zero-Trust delivery active.`);
      logger.info(`[ZERO-TRUST IN-APP OTP] MFA OTP for ${user.email}: ${otp}`);
      return { success: false, error: err.message, inAppOtp: otp, fallbackLogged: true };
    }
  },
};

module.exports = emailService;
