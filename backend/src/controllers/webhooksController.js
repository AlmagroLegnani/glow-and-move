const prisma = require('../lib/prisma');
const { getPayment } = require('../lib/mercadopago');
const { MONTHS_BY_MODE, addMonths, modeForMonths, isInactive } = require('../lib/billing');
const { applyPaidMonths } = require('./blocksController');
const { applyServicePayment } = require('./servicesController');

async function mercadopagoWebhook(req, res) {
  const type = req.query.type || req.body.type || req.query.topic;
  const paymentId = req.query['data.id'] || req.body?.data?.id || req.query.id;

  if (type !== 'payment' || !paymentId) {
    return res.sendStatus(200);
  }

  try {
    const payment = await getPayment(paymentId);
    // userId:planSlug:subscriptionId[:tipo:meses] — las preferencias viejas no traen tipo/meses.
    const [userId, , subscriptionId, kind = 'new', monthsRaw] = String(payment.external_reference || '').split(':');

    if (!subscriptionId) {
      return res.sendStatus(200);
    }

    // Pago único de un servicio complementario: userId:svc-slug:0:service:purchaseId
    if (kind === 'service') {
      await applyServicePayment({ purchaseId: monthsRaw, payment: { ...payment, id: paymentId } });
      return res.sendStatus(200);
    }

    const existingPayment = await prisma.payment.findUnique({ where: { mpPaymentId: String(paymentId) } });
    if (existingPayment) {
      return res.sendStatus(200);
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: Number(subscriptionId) },
      include: { plan: true, user: true },
    });

    if (!subscription) {
      return res.sendStatus(200);
    }

    const months = Number(monthsRaw) || MONTHS_BY_MODE[subscription.billingMode] || 3;

    await prisma.payment.create({
      data: {
        userId: Number(userId),
        subscriptionId: subscription.id,
        mpPaymentId: String(paymentId),
        mpStatus: payment.status,
        amount: payment.transaction_amount ?? subscription.plan.priceUsd,
        currency: payment.currency_id || 'USD',
      },
    });

    if (payment.status !== 'approved') {
      return res.sendStatus(200);
    }

    if (kind === 'renew') {
      // Si renueva antes de vencer, los meses nuevos se suman al final del período actual;
      // si ya estaba vencido, arrancan hoy.
      const from =
        !isInactive(subscription) && subscription.currentPeriodEnd && subscription.currentPeriodEnd > new Date()
          ? subscription.currentPeriodEnd
          : new Date();
      const currentPeriodEnd = addMonths(from, months);
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          isTrial: false,
          trialEndsAt: null,
          billingMode: modeForMonths(months),
          currentPeriodEnd,
        },
      });
      await applyPaidMonths(subscription, months, currentPeriodEnd);
    } else {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          isTrial: false,
          trialEndsAt: null,
          currentPeriodEnd: addMonths(new Date(), months),
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
