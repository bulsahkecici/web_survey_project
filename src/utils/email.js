import nodemailer from 'nodemailer';
import { logger } from '../middlewares/logger.js';

const isProduction = process.env.NODE_ENV === 'production';

// SMTP Configuration
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn(
        'SMTP not configured. Emails will be logged instead of sent.',
      );
      return null;
    }

    transporter = nodemailer.createTransport(smtpConfig);

    // Verify connection configuration
    transporter.verify((error, success) => {
      if (error) {
        logger.error('SMTP connection failed', { error: error.message });
      } else {
        logger.info('SMTP server ready to send emails');
      }
    });
  }

  return transporter;
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body (optional)
 * @returns {Promise<Object>} - Nodemailer info object
 */
export async function sendEmail({ to, subject, text, html }) {
  const transport = getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html: html || text.replace(/\n/g, '<br>'),
  };

  // If SMTP not configured, just log
  if (!transport) {
    logger.info('Email (NOT SENT - SMTP not configured)', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      preview: mailOptions.text.substring(0, 100),
    });
    return { messageId: 'simulated-' + Date.now(), simulated: true };
  }

  try {
    const info = await transport.sendMail(mailOptions);
    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });
    return info;
  } catch (error) {
    logger.error('Email send failed', {
      error: error.message,
      stack: error.stack,
      to: mailOptions.to,
    });
    throw error;
  }
}

/**
 * Send survey invitation email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.surveyTitle - Survey title
 * @param {string} options.surveyUrl - Survey URL with token
 * @param {string} options.message - Custom message (optional)
 */
export async function sendInvitationEmail({
  to,
  surveyTitle,
  surveyUrl,
  message,
}) {
  const defaultMessage = `Merhaba,

${surveyTitle} anketine katılmanızı rica ediyoruz.

Anket linki: ${surveyUrl}

Teşekkürler.`;

  const emailText = message || defaultMessage;
  const subject = `Davetiye: ${surveyTitle}`;

  // Create HTML version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 13px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📋 Anket Daveti</h1>
    </div>
    <div class="content">
      <p style="white-space: pre-line;">${emailText.replace(/\n/g, '<br>')}</p>
      <div style="text-align: center;">
        <a href="${surveyUrl}" class="button">Anketi Başlat</a>
      </div>
    </div>
    <div class="footer">
      Bu davetiye sadece sizin için oluşturulmuştur. Lütfen linki paylaşmayın.
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({ to, subject, text: emailText, html });
}

