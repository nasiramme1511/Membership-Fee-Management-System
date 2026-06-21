const nodemailer = require('nodemailer');

const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT) || 465;
  const isSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
  // Google App Passwords are displayed with spaces (e.g. "abcd efgh ijkl mnop")
  // but the actual password must NOT have spaces. Strip them to be safe.
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s/g, '');

  console.log(`[EmailService] Creating transporter: host=${process.env.SMTP_HOST} port=${port} secure=${isSecure} user=${process.env.SMTP_USER}`);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: smtpPass
    },
    tls: {
      // Do not fail on invalid/self-signed certs in cloud environments
      rejectUnauthorized: false
    }
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('[EmailService] SMTP credentials not configured. Email not sent.');
      console.warn(`[EmailService] SMTP_USER=${process.env.SMTP_USER ? 'SET' : 'MISSING'}, SMTP_PASS=${process.env.SMTP_PASS ? 'SET' : 'MISSING'}`);
      return { success: false, message: 'SMTP credentials not configured.' };
    }

    const transporter = createTransporter();

    // Verify connection before sending (helps catch config issues early)
    try {
      await transporter.verify();
      console.log('[EmailService] SMTP connection verified successfully.');
    } catch (verifyErr) {
      console.error('[EmailService] SMTP connection verification FAILED:', verifyErr.message);
      // Still attempt to send — some servers reject EHLO during verify but accept AUTH
    }

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Prosperity Party Dire Dawa'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Error sending email:', error.message);
    console.error('[EmailService] Full error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
