const { sendEmail } = require('./email');

// Canales habilitados, separados por coma (ej. "email,whatsapp,sms"). Por ahora sólo email
// tiene proveedor; whatsapp y sms quedan como punto de enganche para cuando se elija uno
// (Twilio, WhatsApp Cloud API, etc.) y se ignoran con un aviso en el log si se habilitan
// sin implementación.
function enabledChannels() {
  return (process.env.NOTIFY_CHANNELS || 'email')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

function notConfigured(channel) {
  const err = new Error(`El canal ${channel} todavía no tiene proveedor configurado`);
  err.code = 'CHANNEL_NOT_CONFIGURED';
  return err;
}

const senders = {
  email: (user, message) => sendEmail({ to: user.email, subject: message.subject, html: message.html }),
  // eslint-disable-next-line no-unused-vars
  whatsapp: async (user, message) => {
    throw notConfigured('whatsapp');
  },
  // eslint-disable-next-line no-unused-vars
  sms: async (user, message) => {
    throw notConfigured('sms');
  },
};

// Manda `message` ({ subject, html, text }) por cada canal habilitado. Nunca lanza: devuelve
// el resultado por canal para que el caller registre qué salió y qué no.
async function notifyUser(user, message, { channels = enabledChannels(), skip = [] } = {}) {
  const results = [];
  for (const channel of channels) {
    if (skip.includes(channel)) continue;
    const send = senders[channel];
    if (!send) {
      results.push({ channel, ok: false, error: 'Canal desconocido' });
      continue;
    }
    if ((channel === 'whatsapp' || channel === 'sms') && !user.phone) {
      results.push({ channel, ok: false, error: 'El usuario no tiene teléfono cargado' });
      continue;
    }
    try {
      await send(user, message);
      results.push({ channel, ok: true });
    } catch (err) {
      results.push({ channel, ok: false, error: err.message, code: err.code });
    }
  }
  return results;
}

module.exports = { notifyUser, enabledChannels };
