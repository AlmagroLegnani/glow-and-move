const prisma = require('../lib/prisma');
const { createPreference } = require('../lib/mercadopago');
const { verifyToken } = require('../lib/auth');
const { isInactive } = require('../lib/billing');

// Servicios complementarios: se compran con un pago único y se pueden usar mientras la
// persona tenga un plan pago activo (no prueba gratis, no vencido).

function optionalUserId(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return verifyToken(header.slice(7)).sub;
  } catch {
    return null;
  }
}

async function planAccess(userId) {
  if (!userId) return { canBuy: false, reason: 'login' };
  const sub = await prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
  if (!sub || sub.status !== 'active' || isInactive(sub)) return { canBuy: false, reason: 'plan' };
  return { canBuy: true, reason: null };
}

const contentInclude = {
  routines: { where: { userId: null }, select: { _count: { select: { days: true } } } },
  _count: { select: { videos: true } },
};

function hasContent(service) {
  return service._count.videos > 0 || service.routines.some((r) => r._count.days > 0);
}

function serialize(service, ownedIds) {
  return {
    id: service.id,
    slug: service.slug,
    name: service.name,
    description: service.description,
    priceUsd: Number(service.priceUsd),
    hasContent: hasContent(service),
    owned: ownedIds.has(service.id),
  };
}

async function paidServiceIds(userId) {
  if (!userId) return new Set();
  const purchases = await prisma.servicePurchase.findMany({ where: { userId, status: 'paid' }, select: { serviceId: true } });
  return new Set(purchases.map((p) => p.serviceId));
}

// GET /api/services — público; con token indica qué tiene comprado y si puede comprar.
async function listServices(req, res) {
  const userId = optionalUserId(req);
  const [services, access, owned] = await Promise.all([
    prisma.extraService.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, include: contentInclude }),
    planAccess(userId),
    paidServiceIds(userId),
  ]);
  res.json({ ...access, services: services.map((s) => serialize(s, owned)) });
}

// GET /api/services/:slug — contenido del servicio (rutina + videos) para quien lo compró.
async function getService(req, res) {
  const service = await prisma.extraService.findUnique({
    where: { slug: req.params.slug },
    include: {
      ...contentInclude,
      routines: {
        where: { userId: null },
        orderBy: { id: 'asc' },
        include: { days: { orderBy: { dayNumber: 'asc' }, include: { exercises: { orderBy: { order: 'asc' }, include: { video: true } } } } },
      },
      videos: { orderBy: { sortOrder: 'asc' }, include: { video: true } },
    },
  });
  if (!service || !service.isActive) return res.status(404).json({ error: 'Servicio no encontrado' });

  const owned = await paidServiceIds(req.userId);
  const base = {
    slug: service.slug,
    name: service.name,
    description: service.description,
    priceUsd: Number(service.priceUsd),
  };
  if (!owned.has(service.id)) {
    return res.status(403).json({ error: 'Todavía no compraste este servicio', code: 'NOT_OWNED', service: base });
  }
  const access = await planAccess(req.userId);
  if (!access.canBuy) {
    return res.status(402).json({ error: 'Necesitás un plan activo para usar tus servicios', code: 'PLAN_INACTIVE', service: base });
  }

  res.json({
    ...base,
    routine: service.routines.flatMap((r) =>
      r.days.map((d) => ({
        dayNumber: d.dayNumber,
        label: d.label,
        exercises: d.exercises.map((ex) => ({
          id: ex.id,
          name: ex.video.title,
          videoUrl: ex.video.videoUrl,
          sets: ex.suggestedSets,
          reps: ex.suggestedReps,
          weight: Number(ex.suggestedWeight),
          rest: ex.suggestedRest,
        })),
      }))
    ),
    videos: service.videos.map((sv) => ({
      id: sv.video.id,
      title: sv.video.title,
      description: sv.video.description,
      videoUrl: sv.video.videoUrl,
    })),
  });
}

// POST /api/services/:slug/checkout — crea el pago único en Mercado Pago.
async function checkoutService(req, res) {
  const service = await prisma.extraService.findUnique({ where: { slug: req.params.slug }, include: contentInclude });
  if (!service || !service.isActive) return res.status(404).json({ error: 'Servicio no encontrado' });

  const access = await planAccess(req.userId);
  if (!access.canBuy) {
    return res.status(403).json({ error: 'Los servicios complementarios están disponibles con cualquier plan pago activo', code: 'PLAN_REQUIRED' });
  }

  const existing = await prisma.servicePurchase.findUnique({ where: { userId_serviceId: { userId: req.userId, serviceId: service.id } } });
  if (existing?.status === 'paid') return res.status(409).json({ error: 'Ya tenés este servicio', code: 'ALREADY_OWNED' });

  const purchase = existing
    ? await prisma.servicePurchase.update({ where: { id: existing.id }, data: { amount: service.priceUsd } })
    : await prisma.servicePurchase.create({ data: { userId: req.userId, serviceId: service.id, amount: service.priceUsd } });

  try {
    const frontendUrl = process.env.FRONTEND_URL;
    const preference = await createPreference({
      title: `Glow & Move — ${service.name}`,
      unitPrice: service.priceUsd,
      // userId:svc-slug:0:service:purchaseId — el webhook lo reconoce por el tipo "service".
      externalReference: `${req.userId}:svc-${service.slug}:0:service:${purchase.id}`,
      backUrls: {
        success: `${frontendUrl}/checkout/exito`,
        failure: `${frontendUrl}/checkout/error`,
        pending: `${frontendUrl}/checkout/pendiente`,
      },
      notificationUrl: `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
    });
    await prisma.servicePurchase.update({ where: { id: purchase.id }, data: { mpPreferenceId: preference.id } });
    res.json({ initPoint: preference.init_point });
  } catch (err) {
    if (err.code === 'MP_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'Los pagos todavía no están configurados en el servidor' });
    }
    console.error(err);
    res.status(502).json({ error: 'No se pudo crear el pago con Mercado Pago' });
  }
}

// Llamado desde el webhook de Mercado Pago cuando el pago es de un servicio.
async function applyServicePayment({ purchaseId, payment }) {
  const purchase = await prisma.servicePurchase.findUnique({ where: { id: Number(purchaseId) } });
  if (!purchase) return;
  const data = { mpPaymentId: String(payment.id) };
  if (payment.status === 'approved') {
    data.status = 'paid';
    data.paidAt = new Date();
    data.amount = payment.transaction_amount ?? purchase.amount;
  }
  await prisma.servicePurchase.update({ where: { id: purchase.id }, data });
}

// ---------- Admin ----------

async function adminListServices(req, res) {
  const services = await prisma.extraService.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      ...contentInclude,
      videos: { orderBy: { sortOrder: 'asc' }, include: { video: true } },
      _count: { select: { videos: true, purchases: { where: { status: 'paid' } } } },
    },
  });
  res.json(
    services.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      priceUsd: Number(s.priceUsd),
      isActive: s.isActive,
      sortOrder: s.sortOrder,
      hasContent: hasContent(s),
      purchases: s._count.purchases,
      videos: s.videos.map((sv) => ({ id: sv.video.id, title: sv.video.title })),
    }))
  );
}

async function adminUpdateService(req, res) {
  const { name, description, priceUsd, isActive } = req.body;
  const data = {};
  if (typeof name === 'string' && name.trim()) data.name = name.trim();
  if (typeof description === 'string') data.description = description.trim();
  if (priceUsd !== undefined) {
    const price = Number(priceUsd);
    if (!Number.isFinite(price) || price < 0) return res.status(400).json({ error: 'Precio inválido' });
    data.priceUsd = price;
  }
  if (typeof isActive === 'boolean') data.isActive = isActive;
  const service = await prisma.extraService.update({ where: { id: Number(req.params.id) }, data });
  res.json(service);
}

async function adminListServiceRoutines(req, res) {
  const routines = await prisma.routine.findMany({
    where: { serviceId: Number(req.params.id) },
    include: {
      days: { orderBy: { dayNumber: 'asc' }, include: { exercises: { orderBy: { order: 'asc' }, include: { video: true } } } },
    },
    orderBy: { id: 'asc' },
  });
  res.json(routines);
}

async function adminAddServiceVideo(req, res) {
  const serviceId = Number(req.params.id);
  const videoId = Number(req.body.videoId);
  if (!videoId) return res.status(400).json({ error: 'videoId es requerido' });
  const count = await prisma.serviceVideo.count({ where: { serviceId } });
  await prisma.serviceVideo.upsert({
    where: { serviceId_videoId: { serviceId, videoId } },
    update: {},
    create: { serviceId, videoId, sortOrder: count + 1 },
  });
  res.status(201).json({ ok: true });
}

async function adminRemoveServiceVideo(req, res) {
  await prisma.serviceVideo.deleteMany({ where: { serviceId: Number(req.params.id), videoId: Number(req.params.videoId) } });
  res.status(204).end();
}

module.exports = {
  listServices,
  getService,
  checkoutService,
  applyServicePayment,
  adminListServices,
  adminUpdateService,
  adminListServiceRoutines,
  adminAddServiceVideo,
  adminRemoveServiceVideo,
};
