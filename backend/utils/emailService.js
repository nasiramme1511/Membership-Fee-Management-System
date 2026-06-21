const nodemailer = require('nodemailer');
const dns = require('dns');

/**
 * Resolve a hostname to its first IPv4 address.
 * This is the ONLY reliable way to bypass Render's IPv6-only DNS resolution
 * which causes ENETUNREACH errors when connecting to smtp.gmail.com:465.
 */
function resolveIPv4(hostname) {
  return new Promise((resolve) => {
    dns.resolve4(hostname, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        console.warn(`[EmailService] IPv4 resolution failed for ${hostname}, using hostname directly`);
        resolve(hostname); // fallback to original hostname
      } else {
        console.log(`[EmailService] Resolved ${hostname} → ${addresses[0]} (IPv4)`);
        resolve(addresses[0]);
      }
    });
  });
}

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('[EmailService] SMTP credentials not configured. Email not sent.');
      return { success: false, message: 'SMTP credentials not configured.' };
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    const smtpPass = (process.env.SMTP_PASS || '').replace(/\s/g, '');
    // secure=true only for port 465 (implicit TLS). Port 587 uses STARTTLS (secure=false).
    const isSecure = smtpPort === 465;

    // Pre-resolve to IPv4 to avoid ENETUNREACH on Render (which blocks IPv6 outbound)
    const resolvedHost = await resolveIPv4(smtpHost);

    console.log(`[EmailService] Connecting: host=${resolvedHost} port=${smtpPort} secure=${isSecure} user=${process.env.SMTP_USER}`);

    const transporter = nodemailer.createTransport({
      host: resolvedHost,       // IPv4 address, not hostname
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: smtpPass
      },
      tls: {
        // servername must match the original hostname for TLS cert validation
        servername: smtpHost,
        rejectUnauthorized: false
      }
    });

    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log('[EmailService] SMTP connection verified successfully.');
    } catch (verifyErr) {
      console.error('[EmailService] SMTP verify failed:', verifyErr.message);
      // Still try to send — some servers reject NOOP/EHLO during verify
    }

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Prosperity Party Dire Dawa'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    });

    console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('[EmailService] Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
