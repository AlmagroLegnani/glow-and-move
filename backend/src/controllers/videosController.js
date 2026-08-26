const prisma = require('../lib/prisma');

// El catálogo de ejercicios se muestra siempre (nombre, grupo muscular, descripción) —
// sólo el link de video queda bloqueado si el plan no incluye acceso a videos, con un aviso
// para actualizar de experiencia en vez de ocultar el ejercicio entero.
async function listMyVideos(req, res) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  });

  const hasAccess = !!subscription && subscription.status !== 'canceled' && subscription.plan.hasVideoAccess;
  const videos = await prisma.video.findMany({ orderBy: { sortOrder: 'asc' } });

  res.json({
    locked: false,
    hasVideoAccess: hasAccess,
    upgradeMessage: hasAccess ? null : 'Este contenido está disponible en una experiencia superior.',
    videos: videos.map((v) => ({
      id: v.id,
      title: v.title,
      muscleGroup: v.muscleGroup,
      description: v.description,
      videoUrl: hasAccess ? v.videoUrl : null,
    })),
  });
}

module.exports = { listMyVideos };
