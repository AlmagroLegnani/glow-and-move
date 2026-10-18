import { useEffect, useState } from 'react';

// Avatares ilustrados de la galería (DiceBear, estilos con licencia CC0). Se generan en el
// navegador a partir de una semilla, así que en la base sólo se guarda "preset:estilo:semilla".
// Las librerías pesan ~700 KB, así que se cargan aparte (import dinámico) sólo cuando hace
// falta dibujar un avatar de la galería: la landing para visitantes no las descarga.
const STYLE_LOADERS = {
  lorelei: () => import('@dicebear/lorelei'),
  notionists: () => import('@dicebear/notionists'),
};

// Fondos en la paleta de la marca: cream, beige, blush, sage.
const BACKGROUNDS = ['f0e6da', 'dcc7a8', 'ddaaa0', 'a3a884'];

export const AVATAR_PRESETS = [
  'lorelei:luna',
  'lorelei:alma',
  'lorelei:vera',
  'lorelei:gala',
  'lorelei:iris',
  'lorelei:maia',
  'lorelei:bruno',
  'lorelei:teo',
  'notionists:sol',
  'notionists:mar',
  'notionists:leo',
  'notionists:nina',
].map((id) => `preset:${id}`);

const cache = new Map();

function loadPreset(value) {
  if (cache.has(value)) return cache.get(value);
  const [, styleName, seed] = value.split(':');
  const loadStyle = STYLE_LOADERS[styleName];
  if (!loadStyle) return Promise.resolve(null);
  const promise = Promise.all([import('@dicebear/core'), loadStyle()]).then(([{ createAvatar }, style]) =>
    createAvatar(style, { seed, backgroundColor: BACKGROUNDS, backgroundType: ['solid'] }).toDataUri()
  );
  cache.set(value, promise);
  return promise;
}

// Imagen a mostrar para un valor de avatarUrl: la foto directamente, el avatar de la galería
// cuando termina de generarse, o null si corresponde la inicial (o mientras carga).
export function useAvatarSrc(avatarUrl) {
  const isPhoto = !!avatarUrl && avatarUrl.startsWith('data:image/');
  const isPreset = !!avatarUrl && avatarUrl.startsWith('preset:');
  const [presetSrc, setPresetSrc] = useState(null);

  useEffect(() => {
    if (!isPreset) return undefined;
    let cancelled = false;
    loadPreset(avatarUrl).then((uri) => !cancelled && setPresetSrc({ for: avatarUrl, uri }));
    return () => {
      cancelled = true;
    };
  }, [avatarUrl, isPreset]);

  if (isPhoto) return avatarUrl;
  if (isPreset && presetSrc?.for === avatarUrl) return presetSrc.uri;
  return null;
}

export function userInitial(user) {
  return (user?.firstName || user?.email || '?').trim().charAt(0).toUpperCase();
}

// Recorta la foto al centro en un cuadrado de 256px y la comprime a JPEG, para que el
// avatar pese ~20-60 KB y se pueda guardar directo en la base.
export async function photoToAvatarDataUrl(file, size = 256) {
  // Los errores llevan un `code` para que la UI muestre el mensaje en el idioma elegido.
  if (!file.type.startsWith('image/')) {
    throw Object.assign(new Error('Elegí un archivo de imagen (JPG o PNG).'), { code: 'type' });
  }
  if (file.size > 15 * 1024 * 1024) {
    throw Object.assign(new Error('La imagen es muy pesada. Probá con una de menos de 15 MB.'), { code: 'size' });
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(Object.assign(new Error('No pudimos leer esa imagen. Probá con un JPG o PNG.'), { code: 'read' }));
      el.src = url;
    });

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    // En retratos la cara suele estar arriba: recortamos un poco más cerca del borde superior.
    const sy = Math.max(0, (img.naturalHeight - side) * 0.3);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
