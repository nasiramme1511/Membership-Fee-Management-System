const nodemailer = require('nodemailer');
const net = require('net');
const dns = require('dns');

// Force IPv4 DNS resolution globally — required for Render free tier
// which does NOT support outbound IPv6 (addresses like 2607:f8b0:... get blocked)
dns.setDefaultResultOrder('ipv4first');

const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT) || 587;
  // Port 465 uses implicit SSL, port 587 uses STARTTLS.
  // We switch to 587 because Render free tier has better support for it.
  const isSecure = port === 465;
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s/g, '');

  console.log(`[EmailService] Creating transporter: host=${process.env.SMTP_HOST || 'smtp.gmail.com'} port=${port} secure=${isSecure} user=${process.env.SMTP_USER}`);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false
    },
    // Force IPv4 — critical for Render which blocks outbound IPv6
    family: 4
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

    try {
      await transporter.verify();
      console.log('[EmailService] SMTP connection verified successfully.');
    } catch (verifyErr) {
      console.error('[EmailService] SMTP connection verification FAILED:', verifyErr.message);
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
