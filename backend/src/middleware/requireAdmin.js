const prisma = require('../lib/prisma');

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos sin actividad libera el panel

// Se usa después de requireAuth (necesita req.userId ya seteado). Además de validar el rol,
// se asegura de que ningún otro admin esté usando el panel al mismo tiempo (ver AdminLock).
async function requireAdmin(req, res, next) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'No autorizado' });
  }

  const lock = await prisma.adminLock.findUnique({ where: { id: 1 } });
  const now = new Date();
  const isStale = !lock || !lock.adminUserId || now - lock.lastSeenAt > LOCK_TIMEOUT_MS;

  if (!isStale && lock.adminUserId !== user.id) {
    const holder = await prisma.user.findUnique({ where: { id: lock.adminUserId } });
    return res.status(423).json({
      error: `${holder ? `${holder.firstName} ${holder.lastName}` : 'Otro admin'} está usando el panel ahora mismo. Probá de nuevo en unos minutos.`,
    });
  }

  await prisma.adminLock.upsert({
    where: { id: 1 },
    update: { adminUserId: user.id, lastSeenAt: now },
    create: { id: 1, adminUserId: user.id, lastSeenAt: now },
  });

  next();
}

module.exports = requireAdmin;
