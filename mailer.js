const nodemailer = require('nodemailer');

let transporter;
function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

exports.sendResetEmail = async (to, link) => {
  const t = getTransporter();
  if (!t) {
    // SMTP set nahi hai to link terminal (ya Vercel Logs) mein print hoga
    console.log(`[password reset] SMTP is not configured. Reset link for ${to}: ${link}`);
    return;
  }
  await t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Reset your Haveli password',
    text: `Use this link to choose a new password (valid for 1 hour):\n\n${link}\n\nIf you did not ask for this, ignore this email.`,
    html: `<p>Use this link to choose a new password. It is valid for 1 hour.</p><p><a href="${link}">Reset password</a></p><p>If you did not ask for this, ignore this email.</p>`,
  });
};