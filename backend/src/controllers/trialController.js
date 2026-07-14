const prisma = require('../lib/prisma');
const { hashPassword, signToken } = require('../lib/auth');

const TRIAL_DAYS = 7;

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

async function startTrial(req, res) {
  const {
    firstName,
    lastName,
    documentId,
    nationality,
    phone,
    email,
    password,
    routineChoice,
  } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Nombre, apellido, email y contraseña son requeridos' });
  }

  if (!['tren_superior', 'tren_inferior'].includes(routineChoice)) {
    return res.status(400).json({ error: 'Elegí una rutina: tren_superior o tren_inferior' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Ya existe una cuenta con ese email. Iniciá sesión.' });
  }

  const fullPlan = await prisma.plan.findUnique({ where: { slug: 'full' } });
  if (!fullPlan) {
    return res.status(500).json({ error: 'El plan Full no está configurado' });
  }

  const passwordHash = await hashPassword(password);
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      documentId,
      nationality,
      phone,
      subscriptions: {
        create: {
          planId: fullPlan.id,
          status: 'trial',
          isTrial: true,
          routineChoice,
          trialEndsAt,
        },
      },
    },
    include: { subscriptions: { include: { plan: true } } },
  });

  const token = signToken(user.id);
  res.status(201).json({ token, user: publicUser(user), trialEndsAt });
}

module.exports = { startTrial };
