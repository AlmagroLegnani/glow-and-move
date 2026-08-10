async function sendPasswordResetEmail({ to, resetUrl }) {
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
    body: JSON.stringify({
      from,
      to,
      subject: 'Recuperar tu contraseña — Glow & Move',
      html: `
        <p>Pediste restablecer tu contraseña de Glow & Move.</p>
        <p><a href="${resetUrl}">Hacé clic acá para elegir una contraseña nueva</a>. El link vence en 1 hora.</p>
        <p>Si no fuiste vos, podés ignorar este email.</p>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Resend respondió ${res.status}: ${body}`);
    err.code = 'EMAIL_SEND_FAILED';
    throw err;
  }
}

module.exports = { sendPasswordResetEmail };
