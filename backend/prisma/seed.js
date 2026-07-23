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

// SVGs originales de wger.de (CC-BY-SA 4.0, https://wger.de/api/v2/muscle/),
// auto-hospedados en frontend/public/muscles/ con viewBox agregado (los
// archivos de wger no lo traen, así que no escalan bien como <img> chico).
const VIDEOS = [
  {
    title: 'Sentadillas — técnica base (video de ejemplo)',
    muscleGroup: 'tren_inferior',
    videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    description: 'Reemplazar por el video real de la rutina de tren inferior.',
    muscleImageUrl: '/muscles/quadriceps.svg',
    sortOrder: 1,
  },
  {
    title: 'Zancadas — técnica base (video de ejemplo)',
    muscleGroup: 'tren_inferior',
    videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    description: 'Reemplazar por el video real de la rutina de tren inferior.',
    muscleImageUrl: '/muscles/gluteus-maximus.svg',
    sortOrder: 2,
  },
  {
    title: 'Flexiones — técnica base (video de ejemplo)',
    muscleGroup: 'tren_superior',
    videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    description: 'Reemplazar por el video real de la rutina de tren superior.',
    muscleImageUrl: '/muscles/pectoralis-major.svg',
    sortOrder: 3,
  },
  {
    title: 'Remo con mancuerna — técnica base (video de ejemplo)',
    muscleGroup: 'tren_superior',
    videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    description: 'Reemplazar por el video real de la rutina de tren superior.',
    muscleImageUrl: '/muscles/latissimus-dorsi.svg',
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

  for (const video of VIDEOS) {
    await prisma.video.upsert({
      where: { title: video.title },
      update: video,
      create: video,
    });
  }

  console.log(`Seed ok: ${PLANS.length} planes, ${VIDEOS.length} videos.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
