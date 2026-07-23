const prisma = require('../lib/prisma');
const { hashPassword, comparePassword, signToken } = require('../lib/auth');

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

async function register(req, res) {
  const { email, password, firstName, lastName, nationality, phone } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Nombre, apellido, email y contraseña son requeridos' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName, nationality, phone },
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

async function updateMe(req, res) {
  const { firstName, lastName, documentId, nationality, phone, city, age } = req.body;

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { firstName, lastName, documentId, nationality, phone, city, age },
  });

  res.json(publicUser(user));
}

module.exports = { register, login, me, updateMe };
