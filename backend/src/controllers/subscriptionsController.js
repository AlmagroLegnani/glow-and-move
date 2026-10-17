const prisma = require('../lib/prisma');
const { createPreference } = require('../lib/mercadopago');
const {
  MONTHS_BY_MODE,
  BILLING_MODES,
  MONTHS_PER_BLOCK,
  priceFor,
  labelForMonths,
  addMonths,
  accessEndDate,
  isInactive,
} = require('../lib/billing');

async function getCurrentSubscription(userId) {
  return prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  });
}

// external_reference = userId:planSlug:subscriptionId:tipo:meses — el webhook lo parsea para
// saber si es una compra nueva o una renovación y cuántos meses acreditar.
async function createCheckout({ userId, plan, subscriptionId, kind, months, title }) {
  const price = priceFor(plan, months);
  const frontendUrl = process.env.FRONTEND_URL;
  const backendUrl = process.env.BACKEND_URL;

  const preference = await createPreference({
    title,
    unitPrice: price.total,
    externalReference: `${userId}:${plan.slug}:${subscriptionId}:${kind}:${months}`,
    backUrls: {
      success: `${frontendUrl}/checkout/exito`,
      failure: `${frontendUrl}/checkout/error`,
      pending: `${frontendUrl}/checkout/pendiente`,
    },
    notificationUrl: `${backendUrl}/api/webhooks/mercadopago`,
  });

  return preference;
}

function handleCheckoutError(err, res) {
  if (err.code === 'MP_NOT_CONFIGURED') {
    return res.status(503).json({ error: 'Los pagos todavía no están configurados en el servidor' });
  }
  console.error(err);
  return res.status(502).json({ error: 'No se pudo crear el pago con Mercado Pago' });
}

async function checkout(req, res) {
  const { planSlug } = req.body;
  const billingMode = req.body.billingMode || 'trimestral';
  if (!BILLING_MODES.includes(billingMode)) {
    return res.status(400).json({ error: 'Forma de pago inválida' });
  }

  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) {
    return res.status(404).json({ error: 'Plan no encontrado' });
  }

  const months = MONTHS_BY_MODE[billingMode];
  const subscription = await prisma.subscription.create({
    data: { userId: req.userId, planId: plan.id, status: 'pending_payment', isTrial: false, billingMode },
  });

  try {
    const preference = await createCheckout({
      userId: req.userId,
      plan,
      subscriptionId: subscription.id,
      kind: 'new',
      months,
      title: `${plan.name} — ${labelForMonths(months)}`,
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { mpPreferenceId: preference.id },
    });

    res.json({ initPoint: preference.init_point, subscriptionId: subscription.id });
  } catch (err) {
    handleCheckoutError(err, res);
  }
}

// Bloques del año en curso que todavía no están pagos. Si el usuario nunca abrió su rutina
// (no hay filas BlockProgress) se asume que pagó lo que indica su forma de pago inicial.
async function unpaidBlocksThisYear(subscription) {
  const latest = await prisma.blockProgress.aggregate({
    where: { subscriptionId: subscription.id },
    _max: { cycle: true },
  });
  const cycle = latest._max.cycle;
  if (!cycle) {
    return 4 - MONTHS_BY_MODE[subscription.billingMode] / MONTHS_PER_BLOCK;
  }
  return prisma.blockProgress.count({ where: { subscriptionId: subscription.id, cycle, status: 'locked' } });
}

// Opciones al renovar: trimestral, semestral, o pagar de una lo que resta del año. Si ya no
// quedan bloques sin pagar en el año (terminó el año o había pagado anual), se ofrece
// arrancar el año siguiente: trimestral, semestral o anual.
async function renewalOptionsFor(subscription) {
  const remainingBlocks = await unpaidBlocksThisYear(subscription);
  const remainingMonths = remainingBlocks * MONTHS_PER_BLOCK;

  let monthsList;
  if (remainingMonths === 0) {
    monthsList = [3, 6, 12];
  } else {
    monthsList = [3, 6, remainingMonths].filter((m) => m <= remainingMonths);
  }
  monthsList = [...new Set(monthsList)].sort((a, b) => a - b);

  return {
    remainingMonths,
    options: monthsList.map((months) => ({
      months,
      label: labelForMonths(months, remainingMonths),
      ...priceFor(subscription.plan, months),
    })),
  };
}

async function getRenewalOptions(req, res) {
  const subscription = await getCurrentSubscription(req.userId);
  if (!subscription || !['active', 'past_due', 'trial'].includes(subscription.status)) {
    return res.status(404).json({ error: 'No tenés un plan para renovar' });
  }
  const { remainingMonths, options } = await renewalOptionsFor(subscription);
  res.json({
    planName: subscription.plan.name,
    inactive: isInactive(subscription),
    accessEndsAt: accessEndDate(subscription),
    remainingMonths,
    options,
  });
}

async function renew(req, res) {
  const months = Number(req.body.months);
  const subscription = await getCurrentSubscription(req.userId);
  if (!subscription || !['active', 'past_due', 'trial'].includes(subscription.status)) {
    return res.status(404).json({ error: 'No tenés un plan para renovar' });
  }

  const { options } = await renewalOptionsFor(subscription);
  const option = options.find((o) => o.months === months);
  if (!option) {
    return res.status(400).json({ error: 'Esa opción de pago no está disponible' });
  }

  try {
    const preference = await createCheckout({
      userId: req.userId,
      plan: subscription.plan,
      subscriptionId: subscription.id,
      kind: 'renew',
      months,
      title: `${subscription.plan.name} — Renovación ${option.label}`,
    });
    res.json({ initPoint: preference.init_point, subscriptionId: subscription.id });
  } catch (err) {
    handleCheckoutError(err, res);
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
        currentPeriodEnd: addMonths(new Date(), MONTHS_BY_MODE[current.billingMode] || 3),
      },
      include: { plan: true },
    });
    return res.json({ subscription: updated });
  }

  return checkout(req, res);
}

module.exports = { checkout, changePlan, getRenewalOptions, renew, getCurrentSubscription };
