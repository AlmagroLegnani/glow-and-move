const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PLANS = [
  {
    slug: 'economico',
    name: 'Plan Económico',
    priceUsd: 3.99,
    billingPeriod: 'mensual',
    hasAds: true,
    routineOptions: 1,
    sortOrder: 1,
    features: ['Rutina genérica (1 opción a elegir)', 'Asistente IA para dudas'],
  },
  {
    slug: 'basico',
    name: 'Plan Básico',
    priceUsd: 6.99,
    billingPeriod: 'mensual',
    hasAds: true,
    routineOptions: 2,
    sortOrder: 2,
    features: [
      'Rutina genérica (2 opciones a elegir)',
      'Buzón de comentarios de la app',
      'Asistente IA para dudas',
    ],
  },
  {
    slug: 'premium',
    name: 'Plan Premium',
    priceUsd: 8.99,
    billingPeriod: 'semestral',
    hasAds: false,
    hasVideoAccess: true,
    routineOptions: 3,
    sortOrder: 3,
    features: [
      'Rutina genérica (3 opciones a elegir)',
      'Videos disponibles de los ejercicios',
      'Buzón de comentarios + Asistente IA',
    ],
  },
  {
    slug: 'full',
    name: 'Plan Full',
    priceUsd: 12.99,
    billingPeriod: 'anual',
    hasAds: false,
    hasVideoAccess: true,
    routineOptions: 1,
    sortOrder: 4,
    features: [
      'Rutina de entrenamiento personalizada',
      'Videos de ejercicios y seguimiento de progreso',
      '10% de descuento en convenios y G&M Shop',
      'Dudas por WhatsApp cuando la IA no responde',
    ],
  },
];

const VIDEOS = [
  {
    title: 'Sentadillas — técnica base (video de ejemplo)',
    muscleGroup: 'tren_inferior',
    videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    description: 'Reemplazar por el video real de la rutina de tren inferior.',
    sortOrder: 1,
  },
  {
    title: 'Zancadas — técnica base (video de ejemplo)',
    muscleGroup: 'tren_inferior',
    videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    description: 'Reemplazar por el video real de la rutina de tren inferior.',
    sortOrder: 2,
  },
  {
    title: 'Flexiones — técnica base (video de ejemplo)',
    muscleGroup: 'tren_superior',
    videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    description: 'Reemplazar por el video real de la rutina de tren superior.',
    sortOrder: 3,
  },
  {
    title: 'Remo con mancuerna — técnica base (video de ejemplo)',
    muscleGroup: 'tren_superior',
    videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    description: 'Reemplazar por el video real de la rutina de tren superior.',
    sortOrder: 4,
  },
];

async function main() {
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }

  const existingVideos = await prisma.video.count();
  if (existingVideos === 0) {
    await prisma.video.createMany({ data: VIDEOS });
  }

  console.log(`Seed ok: ${PLANS.length} planes, ${VIDEOS.length} videos.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
