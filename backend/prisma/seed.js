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
    features: [
      'Rutina genérica: 1 opción visible, resto del catálogo con candado',
      'Podés cambiar de rutina cada 3 meses',
      'Asistente IA para dudas',
    ],
  },
  {
    slug: 'basico',
    name: 'Plan Básico',
    priceUsd: 6.99,
    billingPeriod: 'mensual',
    hasAds: true,
    routineOptions: 3,
    sortOrder: 2,
    features: [
      'Rutina genérica: catálogo limitado a 3 opciones',
      'Podés cambiar de rutina cada 3 meses',
      '15% de descuento pagando semestral',
      'Buzón de comentarios de la app',
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
    routineOptions: 6,
    sortOrder: 3,
    features: [
      'Rutina genérica: catálogo completo',
      'Videos disponibles de los ejercicios',
      'Buzón de comentarios + Asistente IA',
      '15% off pagando trimestral (U$S 32.99) o 35% off anual (U$S 99.99)',
      '15% de descuento en otros cursos de la plataforma',
    ],
  },
  {
    slug: 'full',
    name: 'Plan Full',
    priceUsd: 19.99,
    billingPeriod: 'mensual',
    hasAds: false,
    hasVideoAccess: true,
    routineOptions: 1,
    sortOrder: 4,
    features: [
      'Rutina 100% personalizada',
      'Videos de ejercicios y seguimiento de progreso',
      '15% off pagando trimestral (U$S 49.99) o 35% off anual (U$S 149.99)',
      '20% de descuento en otros cursos de la plataforma',
      '10% de descuento en G&M Shop',
      'Dudas por buzón, IA y/o WhatsApp',
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
