const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || 'false') === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOtpEmail(to, otpCode, expiresAt) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP is not configured');
  }

  const from = process.env.SMTP_FROM || 'no-reply@quiz-system.local';
  const expiresAtDate = new Date(expiresAt);
  const minutesLeft = Math.max(1, Math.round((expiresAtDate - Date.now()) / 60000));

  await transporter.sendMail({
    from,
    to,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otpCode}. It expires in ${minutesLeft} minute(s).`,
  });
}

module.exports = { sendOtpEmail };
