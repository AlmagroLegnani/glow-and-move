const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { hashPassword, comparePassword, signToken } = require('../lib/auth');
const { sendPasswordResetEmail } = require('../lib/email');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

async function register(req, res) {
  const { email, password, firstName, lastName, nationality, phone, heightCm, weightKg } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Nombre, apellido, email y contraseña son requeridos' });
  }
  if (!heightCm || !weightKg) {
    return res.status(400).json({ error: 'Peso y altura estimados son requeridos' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      nationality,
      phone,
      heightCm,
      weightKg,
      weightLogs: { create: { weightKg } },
    },
  });

  const token = signToken(user.id);
  res.status(201).json({ token, user: publicUser(user) });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { plan: true },
      },
      healthProfile: true,
    },
  });
  if (!user) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  const token = signToken(user.id);
  res.json({ token, user: publicUser(user) });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { plan: true },
      },
      healthProfile: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json(publicUser(user));
}

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Siempre respondemos igual, exista o no la cuenta, para no revelar qué emails están registrados.
  if (!user) {
    return res.json({ ok: true });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  try {
    await sendPasswordResetEmail({ to: user.email, resetUrl });
  } catch (err) {
    if (err.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'El envío de emails todavía no está configurado en el servidor' });
    }
    console.error('Error enviando email de recuperación', err);
    return res.status(502).json({ error: 'No se pudo enviar el email de recuperación' });
  }

  res.json({ ok: true });
}

async function resetPassword(req, res) {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token y contraseña nueva son requeridos' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return res.status(400).json({ error: 'El link de recuperación es inválido o venció' });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
  });

  res.json({ ok: true });
}

async function updateMe(req, res) {
  const { firstName, lastName, documentId, nationality, phone, city, age } = req.body;

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { firstName, lastName, documentId, nationality, phone, city, age },
  });

  res.json(publicUser(user));
}

async function logWeight(req, res) {
  const { weightKg } = req.body;
  if (!weightKg || Number(weightKg) <= 0) {
    return res.status(400).json({ error: 'Peso inválido' });
  }

  await prisma.weightLog.create({ data: { userId: req.userId, weightKg } });
  const user = await prisma.user.update({ where: { id: req.userId }, data: { weightKg } });

  res.json(publicUser(user));
}

module.exports = { register, login, me, updateMe, forgotPassword, resetPassword, logWeight };
