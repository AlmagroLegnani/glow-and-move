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

  const isActive = !!subscription && subscription.status !== 'canceled';
  const hasAccess = isActive && subscription.plan.hasVideoAccess;
  // Los videos de nivel "experto" son exclusivos del plan Full (rutina personalizada), no
  // alcanza con el acceso a video general de Premium.
  const hasFullAccess = isActive && subscription.plan.hasPersonalizedRoutine;
  const videos = await prisma.video.findMany({ orderBy: { sortOrder: 'asc' } });

  res.json({
    locked: false,
    hasVideoAccess: hasAccess,
    hasFullAccess,
    upgradeMessage: hasAccess ? null : 'Este contenido está disponible en una experiencia superior.',
    videos: videos.map((v) => {
      const unlocked = v.level === 'experto' ? hasFullAccess : hasAccess;
      return {
        id: v.id,
        title: v.title,
        muscleGroup: v.muscleGroup,
        description: v.description,
        level: v.level,
        videoUrl: unlocked ? v.videoUrl : null,
      };
    }),
  });
}

module.exports = { listMyVideos };
