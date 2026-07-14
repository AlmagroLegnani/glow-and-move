const prisma = require('../lib/prisma');

async function listMyVideos(req, res) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  });

  const hasAccess = !!subscription && subscription.status !== 'canceled' && subscription.plan.hasVideoAccess;

  if (!hasAccess) {
    return res.json({
      locked: true,
      message: 'Los videos de ejercicios están disponibles a partir del plan Premium. Cambiá de plan para acceder.',
    });
  }

  const videos = await prisma.video.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json({ locked: false, videos });
}

module.exports = { listMyVideos };
