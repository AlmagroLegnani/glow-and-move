const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

function getClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    const err = new Error('Mercado Pago no está configurado (falta MP_ACCESS_TOKEN)');
    err.code = 'MP_NOT_CONFIGURED';
    throw err;
  }
  return new MercadoPagoConfig({ accessToken });
}

async function createPreference({ title, unitPrice, externalReference, backUrls, notificationUrl }) {
  const client = getClient();
  const preference = new Preference(client);
  return preference.create({
    body: {
      items: [
        {
          title,
          quantity: 1,
          unit_price: Number(unitPrice),
          currency_id: 'USD',
        },
      ],
      external_reference: externalReference,
      back_urls: backUrls,
      auto_return: 'approved',
      notification_url: notificationUrl,
    },
  });
}

async function getPayment(paymentId) {
  const client = getClient();
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

module.exports = { createPreference, getPayment };
