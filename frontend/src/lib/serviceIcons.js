// Ícono (path SVG 24x24, trazo) de cada servicio complementario, por slug. Si se crea un
// servicio nuevo sin ícono propio, se usa el genérico.
export const SERVICE_ICONS = {
  flexibilidad: 'M12 4a2 2 0 1 0 0 .01M5 20l4-8 3 2 3-2 4 8M9 12 7 8M15 12l2-4',
  'higiene-columna': 'M12 3v18M9 5h6M8.5 9h7M9 13h6M9.5 17h5',
  'en-casa': 'M3 11 12 4l9 7M5 10v10h14V10M10 20v-5h4v5',
  trabajo: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
  'en-equipo': 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c.8-3 3.2-5 6-5s5.2 2 6 5M14 15.5c.6-.3 1.3-.5 2-.5 2.8 0 5.2 2 6 5',
  antimigrana: 'M12 3a7 7 0 0 0-4 12.7V19h8v-3.3A7 7 0 0 0 12 3zM10 22h4M12 7v4l2 2',
  'tension-muscular': 'M4 12c2-4 4-4 6 0s4 4 6 0 4-4 4-4M4 17c2-2 4-2 6 0s4 2 6 0',
  hiperlaxitud: 'M7 4v6a5 5 0 0 0 10 0V4M5 20h14M12 15v5',
  bruxismo: 'M6 6c2-2 10-2 12 0 1.5 1.5 1 6-1 9-1 1.5-1.5 5-3 5s-1.5-4-2-4-.5 4-2 4-2-3.5-3-5C5 12 4.5 7.5 6 6z',
  autismo: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z',
  'adulto-mayor': 'M13 4a2 2 0 1 0 0 .01M11 8l-2 6 3 2v5M11 8l3 4 3 1M9 14l-2 7M18 13v8',
  'movilidad-articular': 'M12 5a2 2 0 1 0 0 .01M12 7v6M8 21l4-8 4 8M5 10l7 2 7-2',
};

export const DEFAULT_SERVICE_ICON = 'M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z';

export function serviceIcon(slug) {
  return SERVICE_ICONS[slug] || DEFAULT_SERVICE_ICON;
}

// Agrupación de los servicios en el home. Los slugs que no figuran caen en "otros".
export const SERVICE_CATEGORIES = [
  { key: 'alivio', slugs: ['antimigrana', 'tension-muscular', 'bruxismo', 'higiene-columna'] },
  { key: 'movilidad', slugs: ['flexibilidad', 'movilidad-articular', 'hiperlaxitud'] },
  { key: 'contexto', slugs: ['en-casa', 'trabajo', 'en-equipo'] },
  { key: 'adaptadas', slugs: ['adulto-mayor', 'autismo'] },
];

export function groupServices(services) {
  const groups = SERVICE_CATEGORIES.map((cat) => ({
    key: cat.key,
    services: cat.slugs.map((slug) => services.find((s) => s.slug === slug)).filter(Boolean),
  }));
  const known = new Set(SERVICE_CATEGORIES.flatMap((cat) => cat.slugs));
  groups.push({ key: 'otros', services: services.filter((s) => !known.has(s.slug)) });
  return groups.filter((g) => g.services.length > 0);
}
