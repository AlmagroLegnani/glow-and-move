const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 3 experiencias (la clienta pidió simplificar de 4 a 3: se retira "Económico").
const PLANS = [
  {
    slug: 'basico',
    name: 'Plan Básico',
    priceUsd: 6.99,
    billingPeriod: 'mensual',
    hasAds: true,
    hasVideoAccess: false,
    hasPersonalizedRoutine: false,
    routineOptions: 1,
    sortOrder: 1,
    features: [
      'Rutina genérica con restricciones de contenido',
      'Contiene anuncios',
      'Asistente IA para dudas',
    ],
  },
  {
    slug: 'premium',
    name: 'Plan Premium',
    priceUsd: 12.99,
    billingPeriod: 'mensual',
    hasAds: false,
    hasVideoAccess: true,
    hasPersonalizedRoutine: false,
    routineOptions: 1,
    sortOrder: 2,
    features: [
      'Sin anuncios',
      'Rutina por bloques con bitácora de progreso',
      'Videos de técnica de los ejercicios',
      '15% off pagando trimestral o 35% off anual',
    ],
  },
  {
    slug: 'full',
    name: 'Plan Full',
    priceUsd: 19.99,
    billingPeriod: 'mensual',
    hasAds: false,
    hasVideoAccess: true,
    hasPersonalizedRoutine: true,
    routineOptions: 1,
    sortOrder: 3,
    features: [
      'Todo lo del plan Premium',
      'Rutina 100% personalizada por tu entrenador',
      '20% de descuento en otros cursos de la plataforma',
      'Dudas por buzón, IA y/o WhatsApp',
    ],
  },
];

// Catálogo de ejercicios (mismo que ya usaba "Mis videos"), ahora también con los valores
// sugeridos por defecto que antes vivían hardcodeados aparte en el motor de bloques.
const VIDEOS = [
  {
    title: 'Sentadillas — técnica base',
    muscleGroup: 'tren_inferior',
    videoUrl: 'https://www.youtube.com/watch?v=qsAkuNORgmk',
    description: 'Sin equipo, para hacer en casa. 4 pasos para la técnica correcta — Jeremy Ethier en Español.',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeight: 40,
    sortOrder: 1,
  },
  {
    title: 'Zancadas — técnica base',
    muscleGroup: 'tren_inferior',
    videoUrl: 'https://www.youtube.com/watch?v=2IyAyazvmyE',
    description: 'Sin equipo, para hacer en casa. Técnica correcta, errores comunes y variantes — IvanFit.',
    defaultSets: 4,
    defaultReps: 12,
    defaultWeight: 12,
    sortOrder: 2,
  },
  {
    title: 'Flexiones — técnica base',
    muscleGroup: 'tren_superior',
    videoUrl: 'https://www.youtube.com/watch?v=44JzAk3rvRM',
    description: 'Sin equipo, para hacer en casa. La técnica perfecta para hacer push up — Sport Life España.',
    defaultSets: 4,
    defaultReps: 15,
    defaultWeight: 0,
    sortOrder: 3,
  },
  {
    title: 'Remo con mancuerna — técnica base',
    muscleGroup: 'tren_superior',
    videoUrl: 'https://www.youtube.com/watch?v=PKA8dmUSgNI',
    description: 'Con una mancuerna, pensado para hacer en casa — Fran, Entrenador Remeros.',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeight: 14,
    sortOrder: 4,
  },
];

// 4 bloques del programa anual. objective/description son administrables — este es el
// contenido inicial, se puede editar después desde el admin.
const BLOCKS = [
  {
    number: 1,
    name: 'Bloque 1',
    objective: 'Generar una base de fuerza, resistencia y adaptación al entrenamiento.',
    description: 'Primeros 3 meses del año: foco en aprender la técnica de cada ejercicio.',
    durationWeeks: 12,
    sortOrder: 1,
  },
  {
    number: 2,
    name: 'Bloque 2',
    objective: 'Intensificar el estímulo manteniendo la misma técnica.',
    description: 'Mismos ejercicios que el Bloque 1, con más exigencia.',
    durationWeeks: 12,
    sortOrder: 2,
  },
  {
    number: 3,
    name: 'Bloque 3',
    objective: 'Buscar nuevas marcas personales sobre la base ya construida.',
    description: 'Bloque de mayor exigencia del año.',
    durationWeeks: 12,
    sortOrder: 3,
  },
  {
    number: 4,
    name: 'Bloque 4',
    objective: 'Consolidar los resultados del año.',
    description: 'Cierre del programa anual antes de empezar el siguiente ciclo.',
    durationWeeks: 12,
    sortOrder: 4,
  },
];

// Progresión simple del peso sugerido bloque a bloque (10% por bloque). Es un default
// razonable para arrancar — el admin puede ajustar cada RoutineExercise a mano.
const BLOCK_WEIGHT_FACTOR = [1, 1.1, 1.2, 1.3];

async function main() {
  for (const plan of PLANS) {
    await prisma.plan.upsert({ where: { slug: plan.slug }, update: plan, create: plan });
  }
  // el plan "económico" ya no forma parte de la oferta. Si quedó alguna suscripción de
  // prueba apuntándole, se remapea a "básico" (el escalón más parecido) antes de borrarlo.
  const economico = await prisma.plan.findUnique({ where: { slug: 'economico' } });
  if (economico) {
    const basico = await prisma.plan.findUnique({ where: { slug: 'basico' } });
    await prisma.subscription.updateMany({ where: { planId: economico.id }, data: { planId: basico.id } });
    await prisma.plan.delete({ where: { id: economico.id } });
  }

  const videos = [];
  for (const video of VIDEOS) {
    videos.push(await prisma.video.upsert({ where: { title: video.title }, update: video, create: video }));
  }

  for (let i = 0; i < BLOCKS.length; i += 1) {
    const blockData = BLOCKS[i];
    const block = await prisma.block.upsert({ where: { number: blockData.number }, update: blockData, create: blockData });

    const existingRoutine = await prisma.routine.findFirst({ where: { blockId: block.id, userId: null } });
    if (existingRoutine) continue; // no pisar rutinas ya cargadas/editadas a mano

    const factor = BLOCK_WEIGHT_FACTOR[i] ?? 1;
    const routine = await prisma.routine.create({
      data: { blockId: block.id, name: `Rutina base — ${block.name}` },
    });

    for (let dayNumber = 1; dayNumber <= videos.length; dayNumber += 1) {
      const video = videos[dayNumber - 1];
      const day = await prisma.routineDay.create({
        data: { routineId: routine.id, dayNumber, sortOrder: dayNumber },
      });
      await prisma.routineExercise.create({
        data: {
          routineDayId: day.id,
          videoId: video.id,
          order: 1,
          suggestedSets: video.defaultSets ?? 4,
          suggestedReps: video.defaultReps ?? 10,
          suggestedWeight: video.defaultWeight ? Math.round(Number(video.defaultWeight) * factor * 2) / 2 : 0,
        },
      });
    }
  }

  console.log(`Seed ok: ${PLANS.length} planes, ${VIDEOS.length} ejercicios, ${BLOCKS.length} bloques con rutina base.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
