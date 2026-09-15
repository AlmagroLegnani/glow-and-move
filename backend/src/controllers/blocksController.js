const prisma = require('../lib/prisma');
const { sendBlockUnlockedEmail } = require('../lib/email');

const LOCKED_MESSAGE = 'La rutina por bloques está disponible a partir del plan Premium. Cambiá de plan para acceder.';
const BILLING_MODES = ['trimestral', 'semestral', 'anual'];
// Al pasar de un bloque al siguiente ya no se puede elegir "anual": esa tarifa es solo para
// quien paga todo el año por adelantado desde el principio, no para quien ya viene pagando
// bloque a bloque.
const CONTINUE_BILLING_MODES = ['trimestral', 'semestral'];

async function hasCompletedAnyBlock(subscriptionId) {
  const count = await prisma.blockProgress.count({ where: { subscriptionId, status: 'completed' } });
  return count > 0;
}

function blocksPrepaidByMode(billingMode) {
  if (billingMode === 'anual') return 4;
  if (billingMode === 'semestral') return 2;
  return 1;
}

function paidUntilFor(billingMode, from) {
  const months = billingMode === 'anual' ? 12 : billingMode === 'semestral' ? 6 : 3;
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Crea las 4 filas BlockProgress (cycle 1) la primera vez que un usuario con acceso entra a
// su rutina, según cuántos bloques deja pre-pagos su forma de pago.
async function ensureBlockProgress(subscription) {
  const existing = await prisma.blockProgress.count({ where: { subscriptionId: subscription.id } });
  if (existing > 0) return;

  const blocks = await prisma.block.findMany({ orderBy: { number: 'asc' } });
  const prepaid = blocksPrepaidByMode(subscription.billingMode);
  const now = new Date();

  for (let i = 0; i < blocks.length; i += 1) {
    await prisma.blockProgress.create({
      data: {
        subscriptionId: subscription.id,
        blockId: blocks[i].id,
        cycle: 1,
        status: i === 0 ? 'active' : i < prepaid ? 'scheduled' : 'locked',
        startedAt: i === 0 ? now : null,
        paidUntil: i < prepaid ? paidUntilFor(subscription.billingMode, now) : null,
      },
    });
  }
}

// Reajusta qué bloques todavía no alcanzados quedan pre-pagos cuando cambia la forma de pago.
async function recomputeSchedule(subscriptionId, cycle, billingMode) {
  const rows = await prisma.blockProgress.findMany({
    where: { subscriptionId, cycle },
    include: { block: true },
    orderBy: { block: { number: 'asc' } },
  });
  const activeIdx = rows.findIndex((r) => r.status === 'active');
  if (activeIdx === -1) return;

  const ahead = blocksPrepaidByMode(billingMode) - 1;
  for (let i = activeIdx + 1; i < rows.length; i += 1) {
    if (rows[i].status === 'completed') continue;
    const shouldSchedule = i - activeIdx <= ahead;
    const status = shouldSchedule ? 'scheduled' : 'locked';
    if (rows[i].status !== status) {
      await prisma.blockProgress.update({
        where: { id: rows[i].id },
        data: { status, paidUntil: shouldSchedule ? paidUntilFor(billingMode, new Date()) : null },
      });
    }
  }
}

// Rutina que le corresponde a este usuario en este bloque: primero busca una personalizada
// (Routine.userId = él), si no hay usa la genérica (Routine.userId = null). Así se resuelve
// la personalización del plan Full sin tener que duplicar la rutina para cada usuario Premium.
async function resolveRoutine(blockId, userId) {
  const include = {
    days: { orderBy: { dayNumber: 'asc' }, include: { exercises: { orderBy: { order: 'asc' }, include: { video: true } } } },
  };
  const personalized = await prisma.routine.findFirst({ where: { blockId, userId }, include, orderBy: { id: 'asc' } });
  if (personalized) return { routine: personalized, personalized: true };
  const generic = await prisma.routine.findFirst({ where: { blockId, userId: null }, include, orderBy: { id: 'asc' } });
  return { routine: generic, personalized: false };
}

function serializeBlocks(rows) {
  return rows.map((r) => ({
    number: r.block.number,
    name: r.block.name,
    objective: r.block.objective,
    description: r.block.description,
    durationWeeks: r.block.durationWeeks,
    status: r.status,
    currentWeek: r.currentWeek,
    startedAt: r.startedAt,
    paidUntil: r.paidUntil,
    completedAt: r.completedAt,
  }));
}

// Arma la vista "qué tengo que hacer ahora": bloque activo, semana, día siguiente y sus
// ejercicios con lo sugerido. Es el mismo objeto que devuelven GET /, POST /day, POST /pay
// y POST /billing-mode, para que el frontend siempre pinte con la misma forma de datos.
async function resolveCurrentView(subscription, cycle) {
  const rows = await prisma.blockProgress.findMany({
    where: { subscriptionId: subscription.id, cycle },
    include: { block: true },
    orderBy: { block: { number: 'asc' } },
  });
  const blocks = serializeBlocks(rows);

  if (rows.length === 4 && rows.every((r) => r.status === 'completed')) {
    return { blocks, billingMode: subscription.billingMode, today: { state: 'year_complete' } };
  }

  const active = rows.find((r) => r.status === 'active');
  if (!active) {
    const nextLocked = rows.find((r) => r.status === 'locked');
    return { blocks, billingMode: subscription.billingMode, today: { state: 'awaiting_payment', blockNumber: nextLocked?.block.number ?? null } };
  }

  const { routine, personalized } = await resolveRoutine(active.blockId, subscription.userId);
  if (!routine || routine.days.length === 0) {
    return { blocks, billingMode: subscription.billingMode, today: { state: 'no_routine', blockNumber: active.block.number } };
  }

  const totalDays = routine.days.length;
  const executionsThisWeek = await prisma.dayExecution.count({
    where: { blockProgressId: active.id, weekNumber: active.currentWeek },
  });
  const dayIndex = Math.min(executionsThisWeek, totalDays - 1);
  const day = routine.days[dayIndex];

  return {
    blocks,
    billingMode: subscription.billingMode,
    today: {
      state: 'active',
      blockNumber: active.block.number,
      objective: active.block.objective,
      week: active.currentWeek,
      totalWeeks: active.block.durationWeeks,
      dayNumber: day.dayNumber,
      totalDays,
      routineName: routine.name,
      personalized,
      exercises: day.exercises.map((ex) => ({
        videoId: ex.videoId,
        name: ex.video.title,
        videoUrl: ex.video.videoUrl,
        hasVideoAccess: subscription.plan.hasVideoAccess,
        suggestedSets: ex.suggestedSets,
        suggestedReps: ex.suggestedReps,
        suggestedWeight: Number(ex.suggestedWeight),
        suggestedRest: ex.suggestedRest,
      })),
    },
  };
}

async function loadContext(req, res, next) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    include: { plan: true, user: true },
  });

  const hasAccess = !!subscription && subscription.status !== 'canceled' && subscription.plan.hasVideoAccess;
  if (!hasAccess) {
    return res.json({ locked: true, message: LOCKED_MESSAGE });
  }

  await ensureBlockProgress(subscription);
  const latest = await prisma.blockProgress.aggregate({
    where: { subscriptionId: subscription.id },
    _max: { cycle: true },
  });

  req.subscription = subscription;
  req.cycle = latest._max.cycle || 1;
  next();
}

async function getOverview(req, res) {
  const view = await resolveCurrentView(req.subscription, req.cycle);
  res.json({ locked: false, cycle: req.cycle, ...view });
}

// "¿Realizaste este entrenamiento?" — si performed=true exige reps/peso reales de cada
// ejercicio del día antes de guardar nada; si performed=false no pide ningún dato.
async function logDay(req, res) {
  const subscription = req.subscription;
  const cycle = req.cycle;
  const { performed } = req.body;

  if (typeof performed !== 'boolean') {
    return res.status(400).json({ error: 'Falta indicar si realizaste el entrenamiento' });
  }

  const active = await prisma.blockProgress.findFirst({
    where: { subscriptionId: subscription.id, cycle, status: 'active' },
    include: { block: true },
  });
  if (!active) {
    return res.status(400).json({ error: 'No hay un bloque activo para registrar entrenamiento' });
  }

  const { routine } = await resolveRoutine(active.blockId, subscription.userId);
  if (!routine || routine.days.length === 0) {
    return res.status(400).json({ error: 'Este bloque todavía no tiene una rutina cargada' });
  }

  const totalDays = routine.days.length;
  const executionsThisWeek = await prisma.dayExecution.count({
    where: { blockProgressId: active.id, weekNumber: active.currentWeek },
  });
  if (executionsThisWeek >= totalDays) {
    return res.status(400).json({ error: 'Ya registraste todos los días de esta semana' });
  }
  const day = routine.days[executionsThisWeek];

  let exerciseLogsData = [];
  if (performed) {
    const payload = Array.isArray(req.body.exercises) ? req.body.exercises : [];
    for (const routineExercise of day.exercises) {
      const entry = payload.find((e) => Number(e.videoId) === routineExercise.videoId);
      const actualSets = Number(entry?.actualSets);
      const actualReps = Number(entry?.actualReps);
      const actualWeight = Number(entry?.actualWeight);
      const actualRest = typeof entry?.actualRest === 'string' ? entry.actualRest.trim() : '';
      const setsOk = Number.isFinite(actualSets) && actualSets > 0;
      const repsOk = Number.isFinite(actualReps) && actualReps > 0;
      const weightOk = Number.isFinite(actualWeight) && actualWeight >= 0;
      if (!entry || !setsOk || !repsOk || !weightOk) {
        return res.status(400).json({ error: `Completá series, reps y peso reales de "${routineExercise.video.title}" antes de guardar` });
      }
      exerciseLogsData.push({
        videoId: routineExercise.videoId,
        suggestedSets: routineExercise.suggestedSets,
        suggestedReps: routineExercise.suggestedReps,
        suggestedWeight: routineExercise.suggestedWeight,
        suggestedRest: routineExercise.suggestedRest,
        actualSets,
        actualReps,
        actualWeight,
        actualRest: actualRest || null,
      });
    }
  }

  await prisma.dayExecution.create({
    data: {
      userId: subscription.userId,
      blockProgressId: active.id,
      weekNumber: active.currentWeek,
      dayNumber: day.dayNumber,
      performed,
      exerciseLogs: performed ? { create: exerciseLogsData } : undefined,
    },
  });

  let notice = null;
  const doneCount = executionsThisWeek + 1;
  if (doneCount >= totalDays) {
    const nextWeek = active.currentWeek + 1;
    if (nextWeek > active.block.durationWeeks) {
      await prisma.blockProgress.update({ where: { id: active.id }, data: { status: 'completed', completedAt: new Date() } });
      const next = await prisma.blockProgress.findFirst({
        where: { subscriptionId: subscription.id, cycle, block: { number: active.block.number + 1 } },
      });
      if (next && next.status === 'scheduled') {
        await prisma.blockProgress.update({ where: { id: next.id }, data: { status: 'active', startedAt: new Date() } });
        notice = { type: 'block_unlocked', blockNumber: active.block.number + 1 };
        sendBlockUnlockedEmail(subscription.user, active.block.number + 1).catch((err) => console.error('Error enviando email de bloque desbloqueado', err));
      } else if (next && next.status === 'locked') {
        notice = { type: 'awaiting_payment', blockNumber: active.block.number + 1 };
      } else {
        notice = { type: 'year_complete' };
      }
    } else {
      await prisma.blockProgress.update({ where: { id: active.id }, data: { currentWeek: nextWeek } });
    }
  }

  const view = await resolveCurrentView(subscription, cycle);
  res.json({ locked: false, cycle, ...view, notice });
}

async function payBlock(req, res) {
  const { blockNumber, billingMode } = req.body;
  const bp = await prisma.blockProgress.findFirst({
    where: { subscriptionId: req.subscription.id, cycle: req.cycle, block: { number: blockNumber } },
  });
  if (!bp || bp.status !== 'locked') {
    return res.status(400).json({ error: 'Ese bloque no está pendiente de pago' });
  }

  let effectiveBillingMode = req.subscription.billingMode;
  if (billingMode) {
    if (!CONTINUE_BILLING_MODES.includes(billingMode)) {
      return res.status(400).json({ error: 'Forma de pago inválida' });
    }
    effectiveBillingMode = billingMode;
    await prisma.subscription.update({ where: { id: req.subscription.id }, data: { billingMode } });
  }

  // TODO: cuando haya un producto de Mercado Pago por bloque, generar la preferencia acá
  // (mismo patrón que subscriptionsController.checkout) y desbloquear recién desde el
  // webhook. Por ahora el desbloqueo es inmediato, simulando el pago acreditado.
  await prisma.blockProgress.update({
    where: { id: bp.id },
    data: { status: 'active', startedAt: new Date(), paidUntil: paidUntilFor(effectiveBillingMode, new Date()) },
  });
  await recomputeSchedule(req.subscription.id, req.cycle, effectiveBillingMode);
  sendBlockUnlockedEmail(req.subscription.user, blockNumber).catch((err) => console.error('Error enviando email de bloque desbloqueado', err));

  const view = await resolveCurrentView({ ...req.subscription, billingMode: effectiveBillingMode }, req.cycle);
  res.json({ locked: false, cycle: req.cycle, ...view });
}

async function changeBillingMode(req, res) {
  const { billingMode } = req.body;
  if (!BILLING_MODES.includes(billingMode)) {
    return res.status(400).json({ error: 'Forma de pago inválida' });
  }
  if (billingMode === 'anual' && (await hasCompletedAnyBlock(req.subscription.id))) {
    return res.status(400).json({ error: 'La opción anual ya no está disponible una vez que empezaste a completar bloques' });
  }
  await prisma.subscription.update({ where: { id: req.subscription.id }, data: { billingMode } });
  await recomputeSchedule(req.subscription.id, req.cycle, billingMode);

  const view = await resolveCurrentView({ ...req.subscription, billingMode }, req.cycle);
  res.json({ locked: false, cycle: req.cycle, ...view });
}

function classifyPerformance(avgWeight, avgSuggestedWeight, avgReps, avgSuggestedReps) {
  if (avgWeight > avgSuggestedWeight) return 'superior';
  if (avgWeight < avgSuggestedWeight) return 'inferior';
  if (avgReps > avgSuggestedReps) return 'superior';
  if (avgReps < avgSuggestedReps) return 'inferior';
  return 'esperado';
}

// Adherencia + comparación sugerido/real por bloque, y comparación del mismo ejercicio entre
// bloques. Sin fórmula de progresión: sólo diferencias (delta) y una clasificación simple
// superior/esperado/inferior, tal como pide el punto 12 de los requerimientos.
async function getStats(req, res) {
  const rows = await prisma.blockProgress.findMany({
    where: { subscriptionId: req.subscription.id, cycle: req.cycle },
    include: { block: true },
    orderBy: { block: { number: 'asc' } },
  });

  const perBlock = [];
  const byExercise = {};

  for (const bp of rows) {
    const executions = await prisma.dayExecution.findMany({
      where: { blockProgressId: bp.id },
      include: { exerciseLogs: { include: { video: true } } },
    });
    const performedCount = executions.filter((e) => e.performed).length;
    const missedCount = executions.filter((e) => !e.performed).length;

    const grouped = {};
    for (const execution of executions) {
      if (!execution.performed) continue;
      for (const log of execution.exerciseLogs) {
        if (!grouped[log.videoId]) grouped[log.videoId] = { name: log.video.title, weights: [], reps: [], sWeights: [], sReps: [] };
        grouped[log.videoId].weights.push(Number(log.actualWeight));
        grouped[log.videoId].reps.push(log.actualReps);
        grouped[log.videoId].sWeights.push(Number(log.suggestedWeight));
        grouped[log.videoId].sReps.push(log.suggestedReps);
      }
    }

    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const exercises = Object.entries(grouped).map(([videoId, d]) => {
      const avgWeight = avg(d.weights);
      const avgReps = avg(d.reps);
      const avgSuggestedWeight = avg(d.sWeights);
      const avgSuggestedReps = avg(d.sReps);
      const point = {
        videoId: Number(videoId),
        name: d.name,
        avgWeight,
        avgReps,
        avgSuggestedWeight,
        avgSuggestedReps,
        weightDelta: avgWeight - avgSuggestedWeight,
        repsDelta: avgReps - avgSuggestedReps,
        performance: classifyPerformance(avgWeight, avgSuggestedWeight, avgReps, avgSuggestedReps),
      };
      if (!byExercise[videoId]) byExercise[videoId] = { name: d.name, points: [] };
      byExercise[videoId].points.push({ blockNumber: bp.block.number, avgWeight, avgReps });
      return point;
    });

    perBlock.push({
      blockNumber: bp.block.number,
      blockName: bp.block.name,
      status: bp.status,
      performedCount,
      missedCount,
      adherencePct: performedCount + missedCount > 0 ? Math.round((performedCount / (performedCount + missedCount)) * 100) : null,
      exercises,
    });
  }

  res.json({ locked: false, perBlock, comparison: Object.values(byExercise) });
}

async function startNewYear(req, res) {
  const rows = await prisma.blockProgress.findMany({ where: { subscriptionId: req.subscription.id, cycle: req.cycle } });
  if (rows.length !== 4 || !rows.every((r) => r.status === 'completed')) {
    return res.status(400).json({ error: 'Todavía no completaste los 4 bloques de este año' });
  }

  const nextCycle = req.cycle + 1;
  const blocks = await prisma.block.findMany({ orderBy: { number: 'asc' } });
  const prepaid = blocksPrepaidByMode(req.subscription.billingMode);
  const now = new Date();

  for (let i = 0; i < blocks.length; i += 1) {
    await prisma.blockProgress.create({
      data: {
        subscriptionId: req.subscription.id,
        blockId: blocks[i].id,
        cycle: nextCycle,
        status: i === 0 ? 'active' : i < prepaid ? 'scheduled' : 'locked',
        startedAt: i === 0 ? now : null,
        paidUntil: i < prepaid ? paidUntilFor(req.subscription.billingMode, now) : null,
      },
    });
  }

  const view = await resolveCurrentView(req.subscription, nextCycle);
  res.json({ locked: false, cycle: nextCycle, ...view });
}

module.exports = {
  loadContext,
  getOverview,
  logDay,
  payBlock,
  changeBillingMode,
  getStats,
  startNewYear,
};
