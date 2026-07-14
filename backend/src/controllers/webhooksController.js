const prisma = require('../lib/prisma');
const { getPayment } = require('../lib/mercadopago');
const { PERIOD_MONTHS, addMonths } = require('./subscriptionsController');

async function mercadopagoWebhook(req, res) {
  const type = req.query.type || req.body.type || req.query.topic;
  const paymentId = req.query['data.id'] || req.body?.data?.id || req.query.id;

  if (type !== 'payment' || !paymentId) {
    return res.sendStatus(200);
  }

  try {
    const payment = await getPayment(paymentId);
    const [userId, , subscriptionId] = String(payment.external_reference || '').split(':');

    if (!subscriptionId) {
      return res.sendStatus(200);
    }

    const existingPayment = await prisma.payment.findUnique({ where: { mpPaymentId: String(paymentId) } });
    if (existingPayment) {
      return res.sendStatus(200);
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: Number(subscriptionId) },
      include: { plan: true },
    });

    if (!subscription) {
      return res.sendStatus(200);
    }

    await prisma.payment.create({
      data: {
        userId: Number(userId),
        subscriptionId: subscription.id,
        mpPaymentId: String(paymentId),
        mpStatus: payment.status,
        amount: subscription.plan.priceUsd,
        currency: 'USD',
      },
    });

    if (payment.status === 'approved') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          isTrial: false,
          trialEndsAt: null,
          currentPeriodEnd: addMonths(new Date(), PERIOD_MONTHS[subscription.plan.billingPeriod] || 1),
        },
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Error procesando webhook de Mercado Pago', err);
    res.sendStatus(200);
  }
}

module.exports = { mercadopagoWebhook };
