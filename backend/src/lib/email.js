// Envío genérico vía Resend. Lanza EMAIL_NOT_CONFIGURED si falta la API key, para que cada
// caller decida si eso es fatal (reset de contraseña) o sólo se loguea (avisos).
async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error('El envío de emails no está configurado (falta RESEND_API_KEY)');
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }

  const from = process.env.RESEND_FROM || 'Glow & Move <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Resend respondió ${res.status}: ${body}`);
    err.code = 'EMAIL_SEND_FAILED';
    throw err;
  }
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  return sendEmail({
    to,
    subject: 'Recuperar tu contraseña — Glow & Move',
    html: `
      <p>Pediste restablecer tu contraseña de Glow & Move.</p>
      <p><a href="${resetUrl}">Hacé clic acá para elegir una contraseña nueva</a>. El link vence en 1 hora.</p>
      <p>Si no fuiste vos, podés ignorar este email.</p>
    `,
  });
}

// Aviso de "nueva rutina/bloque disponible". No es fatal si falla: el desbloqueo del bloque
// ya ocurrió, el caller lo loguea y sigue.
async function sendBlockUnlockedEmail(user, blockNumber) {
  return sendEmail({
    to: user.email,
    subject: `Bloque ${blockNumber} ya está en tu rutina — Glow & Move`,
    html: `
      <p>Hola ${user.firstName},</p>
      <p>El Bloque ${blockNumber} de tu programa ya está disponible. Entrá a la app para ver tu rutina y objetivos.</p>
    `,
  });
}

module.exports = { sendEmail, sendPasswordResetEmail, sendBlockUnlockedEmail };
