const prisma = require('../lib/prisma');

// ---------- Usuarios ----------

async function listUsers(req, res) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1, include: { plan: true } } },
  });
  res.json(users.map(({ passwordHash, ...u }) => u));
}

async function updateUserRole(req, res) {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data: { role } });
  const { passwordHash, ...rest } = user;
  res.json(rest);
}

async function updateSubscriptionStatus(req, res) {
  const { status } = req.body;
  const valid = ['trial', 'pending_payment', 'active', 'past_due', 'canceled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  const subscription = await prisma.subscription.update({
    where: { id: Number(req.params.id) },
    data: { status },
    include: { plan: true },
  });
  res.json(subscription);
}

// ---------- Planes ----------

async function listPlans(req, res) {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json(plans);
}

async function updatePlan(req, res) {
  const { name, priceUsd, billingPeriod, hasAds, hasVideoAccess, hasPersonalizedRoutine, routineOptions, features, sortOrder } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (priceUsd !== undefined) data.priceUsd = priceUsd;
  if (billingPeriod !== undefined) data.billingPeriod = billingPeriod;
  if (hasAds !== undefined) data.hasAds = !!hasAds;
  if (hasVideoAccess !== undefined) data.hasVideoAccess = !!hasVideoAccess;
  if (hasPersonalizedRoutine !== undefined) data.hasPersonalizedRoutine = !!hasPersonalizedRoutine;
  if (routineOptions !== undefined) data.routineOptions = routineOptions;
  if (Array.isArray(features)) data.features = features;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const plan = await prisma.plan.update({ where: { id: Number(req.params.id) }, data });
  res.json(plan);
}

// ---------- Bloques ----------

async function listBlocks(req, res) {
  const blocks = await prisma.block.findMany({ orderBy: { number: 'asc' } });
  res.json(blocks);
}

async function updateBlock(req, res) {
  const { name, objective, description, durationWeeks, sortOrder } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (objective !== undefined) data.objective = objective;
  if (description !== undefined) data.description = description;
  if (durationWeeks !== undefined) data.durationWeeks = durationWeeks;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const block = await prisma.block.update({ where: { id: Number(req.params.id) }, data });
  res.json(block);
}

// ---------- Ejercicios (catálogo Video) ----------

async function listVideos(req, res) {
  const videos = await prisma.video.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json(videos);
}

async function createVideo(req, res) {
  const { title, videoUrl, muscleGroup, description, defaultSets, defaultReps, defaultWeight, sortOrder } = req.body;
  if (!title || !videoUrl) {
    return res.status(400).json({ error: 'Nombre y link de video son requeridos' });
  }
  const video = await prisma.video.create({
    data: { title, videoUrl, muscleGroup, description, defaultSets, defaultReps, defaultWeight, sortOrder: sortOrder ?? 0 },
  });
  res.status(201).json(video);
}

async function updateVideo(req, res) {
  const { title, videoUrl, muscleGroup, description, defaultSets, defaultReps, defaultWeight, sortOrder } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (videoUrl !== undefined) data.videoUrl = videoUrl;
  if (muscleGroup !== undefined) data.muscleGroup = muscleGroup;
  if (description !== undefined) data.description = description;
  if (defaultSets !== undefined) data.defaultSets = defaultSets;
  if (defaultReps !== undefined) data.defaultReps = defaultReps;
  if (defaultWeight !== undefined) data.defaultWeight = defaultWeight;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const video = await prisma.video.update({ where: { id: Number(req.params.id) }, data });
  res.json(video);
}

async function deleteVideo(req, res) {
  await prisma.video.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
}

// ---------- Rutinas / días / ejercicios de rutina ----------

async function listRoutinesForBlock(req, res) {
  const blockId = Number(req.params.blockId);
  const routines = await prisma.routine.findMany({
    where: { blockId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      days: { orderBy: { dayNumber: 'asc' }, include: { exercises: { orderBy: { order: 'asc' }, include: { video: true } } } },
    },
    orderBy: { id: 'asc' },
  });
  res.json(routines);
}

async function createRoutine(req, res) {
  const { blockId, userId, name } = req.body;
  if (!blockId || !name) {
    return res.status(400).json({ error: 'blockId y name son requeridos' });
  }
  const routine = await prisma.routine.create({
    data: { blockId: Number(blockId), userId: userId ? Number(userId) : null, name },
  });
  res.status(201).json(routine);
}

async function deleteRoutine(req, res) {
  await prisma.routine.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
}

async function createRoutineDay(req, res) {
  const { dayNumber, label, sortOrder } = req.body;
  if (!dayNumber) {
    return res.status(400).json({ error: 'dayNumber es requerido' });
  }
  const day = await prisma.routineDay.create({
    data: { routineId: Number(req.params.id), dayNumber, label, sortOrder: sortOrder ?? dayNumber },
  });
  res.status(201).json(day);
}

async function deleteRoutineDay(req, res) {
  await prisma.routineDay.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
}

async function createRoutineExercise(req, res) {
  const { videoId, order, suggestedSets, suggestedReps, suggestedWeight } = req.body;
  if (!videoId || !suggestedSets || !suggestedReps || suggestedWeight === undefined) {
    return res.status(400).json({ error: 'videoId, suggestedSets, suggestedReps y suggestedWeight son requeridos' });
  }
  const exercise = await prisma.routineExercise.create({
    data: {
      routineDayId: Number(req.params.id),
      videoId: Number(videoId),
      order: order ?? 0,
      suggestedSets,
      suggestedReps,
      suggestedWeight,
    },
  });
  res.status(201).json(exercise);
}

async function updateRoutineExercise(req, res) {
  const { order, suggestedSets, suggestedReps, suggestedWeight } = req.body;
  const data = {};
  if (order !== undefined) data.order = order;
  if (suggestedSets !== undefined) data.suggestedSets = suggestedSets;
  if (suggestedReps !== undefined) data.suggestedReps = suggestedReps;
  if (suggestedWeight !== undefined) data.suggestedWeight = suggestedWeight;

  const exercise = await prisma.routineExercise.update({ where: { id: Number(req.params.id) }, data });
  res.json(exercise);
}

async function deleteRoutineExercise(req, res) {
  await prisma.routineExercise.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
}

module.exports = {
  listUsers,
  updateUserRole,
  updateSubscriptionStatus,
  listPlans,
  updatePlan,
  listBlocks,
  updateBlock,
  listVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  listRoutinesForBlock,
  createRoutine,
  deleteRoutine,
  createRoutineDay,
  deleteRoutineDay,
  createRoutineExercise,
  updateRoutineExercise,
  deleteRoutineExercise,
};
