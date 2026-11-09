// Nombres y descripciones de los servicios complementarios en inglés y portugués, por slug.
// En la base sólo están en español (lo que se edita desde el admin): en "es", o para un
// servicio nuevo sin traducción acá, se muestra lo de la base tal cual.
const SERVICE_TEXT = {
  en: {
    flexibilidad: {
      name: 'Flexibility routine',
      short: 'Flexibility',
      description: 'Progressive stretching to gain range of motion and loosen up your body.',
    },
    'higiene-columna': {
      name: 'Spine care routine',
      short: 'Spine care',
      description: 'Posture and core strengthening to look after your back day to day.',
    },
    'en-casa': {
      name: 'At-home routine',
      short: 'At home',
      description: 'Full workouts with no equipment, for any space in your home.',
    },
    trabajo: {
      name: 'Workplace training routine',
      short: 'At work',
      description: 'Short active breaks to do at the office or wherever you work.',
    },
    'en-equipo': {
      name: 'Team routine',
      short: 'As a team',
      description: 'Routines to train as a couple or in a group, with shared exercises.',
    },
    antimigrana: {
      name: 'Migraine relief routine',
      short: 'Migraine relief',
      description: 'Neck and shoulder mobility, breathing and relaxation to ease migraine-related tension.',
    },
    'tension-muscular': {
      name: 'Muscle tension routine',
      short: 'Muscle tension',
      description: 'Gentle release and stretching to loosen knots and built-up tension.',
    },
    hiperlaxitud: {
      name: 'Hypermobility routine',
      short: 'Hypermobility',
      description: 'Strength and joint control to give stability to overly flexible joints.',
    },
    bruxismo: {
      name: 'Bruxism routine',
      short: 'Bruxism',
      description: 'Jaw and neck relaxation with breathing exercises to reduce teeth-clenching tension.',
    },
    autismo: {
      name: 'Autism routine',
      short: 'Autism',
      description: 'Adapted, predictable and sensory-friendly routines designed for autistic people.',
    },
    'adulto-mayor': {
      name: 'Older adults routine (physiotherapy)',
      short: 'Older adults (physiotherapy)',
      description: 'Physiotherapy exercises for balance, strength and independence, adapted for older adults.',
    },
    'movilidad-articular': {
      name: 'Joint mobility and stretching routine',
      short: 'Joint mobility and stretching',
      description: 'Head-to-toe mobility and stretching to start or wind down your day.',
    },
  },
  pt: {
    flexibilidad: {
      name: 'Treino de flexibilidade',
      short: 'Flexibilidade',
      description: 'Alongamentos progressivos para ganhar amplitude de movimento e soltar o corpo.',
    },
    'higiene-columna': {
      name: 'Treino de cuidado da coluna',
      short: 'Cuidado da coluna',
      description: 'Postura e fortalecimento do core para cuidar das costas no dia a dia.',
    },
    'en-casa': {
      name: 'Treino em casa',
      short: 'Em casa',
      description: 'Treinos completos sem equipamento, para qualquer espaço da sua casa.',
    },
    trabajo: {
      name: 'Treino no trabalho',
      short: 'No trabalho',
      description: 'Pausas ativas curtas para fazer no escritório ou no seu local de trabalho.',
    },
    'en-equipo': {
      name: 'Treino em equipe',
      short: 'Em equipe',
      description: 'Treinos para fazer em dupla ou em grupo, com exercícios compartilhados.',
    },
    antimigrana: {
      name: 'Treino antienxaqueca',
      short: 'Antienxaqueca',
      description: 'Mobilidade de pescoço e ombros, respiração e relaxamento para aliviar a tensão associada à enxaqueca.',
    },
    'tension-muscular': {
      name: 'Treino de tensão muscular',
      short: 'Tensão muscular',
      description: 'Liberação e alongamentos suaves para soltar contraturas e tensão acumulada.',
    },
    hiperlaxitud: {
      name: 'Treino de hipermobilidade',
      short: 'Hipermobilidade',
      description: 'Fortalecimento e controle articular para dar estabilidade a articulações com excesso de mobilidade.',
    },
    bruxismo: {
      name: 'Treino de bruxismo',
      short: 'Bruxismo',
      description: 'Relaxamento de mandíbula e pescoço com exercícios de respiração para reduzir a tensão de apertar os dentes.',
    },
    autismo: {
      name: 'Treino autismo',
      short: 'Autismo',
      description: 'Treinos adaptados, previsíveis e sensorialmente amigáveis, pensados para pessoas no espectro autista.',
    },
    'adulto-mayor': {
      name: 'Treino terceira idade (fisioterapia)',
      short: 'Terceira idade (fisioterapia)',
      description: 'Exercícios de fisioterapia para equilíbrio, força e autonomia, adaptados à terceira idade.',
    },
    'movilidad-articular': {
      name: 'Treino de mobilidade articular e alongamentos',
      short: 'Mobilidade articular e alongamentos',
      description: 'Mobilidade da cabeça aos pés e alongamentos para começar ou encerrar o dia.',
    },
  },
};

// "Rutina en casa" → "En casa": dentro de una categoría el prefijo sobra.
function stripRoutinePrefix(name) {
  const rest = name.replace(/^rutina\s+/i, '');
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

// Devuelve el servicio con name/description en el idioma elegido y un nombre corto para listas.
export function localizeService(service, lang) {
  if (!service) return service;
  const text = SERVICE_TEXT[lang]?.[service.slug];
  if (!text) return { ...service, shortName: stripRoutinePrefix(service.name) };
  return { ...service, name: text.name, description: text.description, shortName: text.short };
}
