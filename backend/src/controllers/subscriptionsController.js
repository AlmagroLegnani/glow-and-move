const prisma = require('../lib/prisma');
const { createPreference } = require('../lib/mercadopago');

const PERIOD_MONTHS = { mensual: 1, semestral: 6, anual: 12 };

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

async function getCurrentSubscription(userId) {
  return prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  });
}

async function checkout(req, res) {
  const { planSlug } = req.body;
  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) {
    return res.status(404).json({ error: 'Plan no encontrado' });
  }

  const subscription = await prisma.subscription.create({
    data: { userId: req.userId, planId: plan.id, status: 'pending_payment', isTrial: false },
  });

  const externalReference = `${req.userId}:${plan.slug}:${subscription.id}`;
  const frontendUrl = process.env.FRONTEND_URL;
  const backendUrl = process.env.BACKEND_URL;

  try {
    const preference = await createPreference({
      title: plan.name,
      unitPrice: plan.priceUsd,
      externalReference,
      backUrls: {
        success: `${frontendUrl}/checkout/exito`,
        failure: `${frontendUrl}/checkout/error`,
        pending: `${frontendUrl}/checkout/pendiente`,
      },
      notificationUrl: `${backendUrl}/api/webhooks/mercadopago`,
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { mpPreferenceId: preference.id },
    });

    res.json({ initPoint: preference.init_point, subscriptionId: subscription.id });
  } catch (err) {
    if (err.code === 'MP_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'Los pagos todavía no están configurados en el servidor' });
    }
    console.error(err);
    res.status(502).json({ error: 'No se pudo crear el pago con Mercado Pago' });
  }
}

async function changePlan(req, res) {
  const { planSlug } = req.body;
  const newPlan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!newPlan) {
    return res.status(404).json({ error: 'Plan no encontrado' });
  }

  const current = await getCurrentSubscription(req.userId);
  const isDowngrade = current && Number(newPlan.priceUsd) <= Number(current.plan.priceUsd);

  if (isDowngrade) {
    const updated = await prisma.subscription.update({
      where: { id: current.id },
      data: {
        planId: newPlan.id,
        status: 'active',
        isTrial: false,
        trialEndsAt: null,
        currentPeriodEnd: addMonths(new Date(), PERIOD_MONTHS[newPlan.billingPeriod] || 1),
      },
      include: { plan: true },
    });
    return res.json({ subscription: updated });
  }

  return checkout(req, res);
}

module.exports = { checkout, changePlan, getCurrentSubscription, PERIOD_MONTHS, addMonths };
