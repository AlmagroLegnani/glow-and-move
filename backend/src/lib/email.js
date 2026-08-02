const nodemailer = require('nodemailer');

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    const err = new Error('El envío de emails no está configurado (falta SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD)');
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `Glow & Move <${from}>`,
    to,
    subject: 'Recuperar tu contraseña — Glow & Move',
    html: `
      <p>Pediste restablecer tu contraseña de Glow & Move.</p>
      <p><a href="${resetUrl}">Hacé clic acá para elegir una contraseña nueva</a>. El link vence en 1 hora.</p>
      <p>Si no fuiste vos, podés ignorar este email.</p>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
