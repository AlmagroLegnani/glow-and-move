const prisma = require('../lib/prisma');

// Se usa después de requireAuth (necesita req.userId ya seteado).
async function requireAdmin(req, res, next) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  next();
}

module.exports = requireAdmin;
