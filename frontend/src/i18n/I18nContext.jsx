import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import es from './es.js';
import en from './en.js';
import pt from './pt.js';
import accountEs from './account.es.js';
import accountEn from './account.en.js';
import accountPt from './account.pt.js';

// Textos del sitio público + páginas de cuenta (en archivos separados para que no crezcan tanto).
const DICTIONARIES = {
  es: { ...es, ...accountEs },
  en: { ...en, ...accountEn },
  pt: { ...pt, ...accountPt },
};
export const LANGUAGES = [
  { code: 'es', label: 'ES', name: 'Español', locale: 'es-UY' },
  { code: 'en', label: 'EN', name: 'English', locale: 'en-US' },
  { code: 'pt', label: 'PT', name: 'Português', locale: 'pt-BR' },
];
const STORAGE_KEY = 'glowmove_lang';

const I18nContext = createContext(null);

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DICTIONARIES[saved]) return saved;
  } catch {
    /* storage bloqueado: seguimos con español */
  }
  return 'es';
}

function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict);
}

// Reemplaza {nombre} por vars.nombre.
function interpolate(text, vars) {
  if (!vars || typeof text !== 'string') return text;
  return text.replace(/\{(\w+)\}/g, (m, name) => (vars[name] !== undefined ? vars[name] : m));
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  const setLang = useCallback((code) => {
    if (!DICTIONARIES[code]) return;
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* sin storage, el idioma dura sólo esta visita */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Si falta una traducción, cae al español; si tampoco existe, muestra la clave.
  const t = useCallback(
    (key, vars) => {
      const value = lookup(DICTIONARIES[lang], key) ?? lookup(DICTIONARIES.es, key) ?? key;
      return interpolate(value, vars);
    },
    [lang]
  );

  const locale = LANGUAGES.find((l) => l.code === lang)?.locale || 'es-UY';

  const value = useMemo(() => ({ lang, setLang, t, locale }), [lang, setLang, t, locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n debe usarse dentro de I18nProvider');
  return ctx;
}
