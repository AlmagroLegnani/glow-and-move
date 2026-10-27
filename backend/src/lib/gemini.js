// Cliente mínimo de la API de Gemini (endpoint generateContent). Sin SDK para no sumar
// dependencias: es un solo POST. El modelo se puede cambiar con GEMINI_MODEL sin tocar código.
const DEFAULT_MODEL = 'gemini-3.8-flash';
// Si el modelo principal está saturado (503/429), no existe o tarda demasiado, se prueba con
// los de GEMINI_FALLBACK_MODELS (separados por coma) y, si tampoco andan, con los modelos
// "flash" que la propia API informa como disponibles para esta clave.
const DEFAULT_FALLBACK_MODELS = [];
const MAX_DISCOVERED = 3;
const TIMEOUT_MS = 20000;
const RETRYABLE_STATUS = new Set([404, 429, 500, 503, 504]);

function notConfigured() {
  const err = new Error('El asistente todavía no está configurado (falta GEMINI_API_KEY)');
  err.code = 'GEMINI_NOT_CONFIGURED';
  return err;
}

function modelChain() {
  const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const fallbacks = process.env.GEMINI_FALLBACK_MODELS
    ? process.env.GEMINI_FALLBACK_MODELS.split(',').map((m) => m.trim()).filter(Boolean)
    : DEFAULT_FALLBACK_MODELS;
  return [primary, ...fallbacks.filter((m) => m !== primary)];
}

// Lista de modelos flash con generateContent disponibles para la clave, del más nuevo al más
// viejo. Se cachea en memoria para no consultarla en cada mensaje.
let discovered = null;
async function discoverFlashModels(apiKey) {
  if (discovered) return discovered;
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
      headers: { 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    discovered = (data.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => m.name.replace(/^models\//, ''))
      .filter((name) => /flash/.test(name) && !/(image|tts|audio|live|embedding|lite)/.test(name))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  } catch (err) {
    console.warn('Asistente IA: no se pudo listar los modelos de Gemini.', err.message);
    return [];
  }
  return discovered;
}

async function callModel({ apiKey, model, systemPrompt, history }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: history.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.text }],
        })),
      }),
    });
  } catch (err) {
    const e = new Error(err.name === 'AbortError' ? 'Gemini tardó demasiado en responder' : `No se pudo contactar a Gemini: ${err.message}`);
    e.code = 'GEMINI_UNAVAILABLE';
    e.retryable = true;
    throw e;
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(`Gemini (${model}) respondió ${res.status}: ${data?.error?.message || 'error desconocido'}`);
    e.code = res.status === 429 ? 'GEMINI_RATE_LIMITED' : 'GEMINI_ERROR';
    e.status = res.status;
    e.retryable = RETRYABLE_STATUS.has(res.status);
    throw e;
  }

  // Se ignoran las partes de "pensamiento" del modelo: sólo se devuelve el texto final.
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .filter((p) => typeof p.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('')
    .trim();

  if (!text) {
    const e = new Error('Gemini no devolvió texto');
    e.code = data?.promptFeedback?.blockReason ? 'GEMINI_BLOCKED' : 'GEMINI_EMPTY';
    throw e;
  }
  return text;
}

// history: [{ role: 'user' | 'assistant', text }]
async function generateReply({ systemPrompt, history }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw notConfigured();

  const tried = new Set();
  let lastError;
  async function attempt(models) {
    for (const model of models) {
      if (tried.has(model)) continue;
      tried.add(model);
      try {
        return await callModel({ apiKey, model, systemPrompt, history });
      } catch (err) {
        lastError = err;
        if (!err.retryable) throw err;
        console.warn(`Asistente IA: falló ${model}, probando el siguiente modelo.`, err.message);
      }
    }
    return null;
  }

  const reply =
    (await attempt(modelChain())) ||
    (await attempt((await discoverFlashModels(apiKey)).filter((m) => !tried.has(m)).slice(0, MAX_DISCOVERED)));
  if (reply) return reply;
  lastError.tried = [...tried];
  throw lastError;
}

module.exports = { generateReply };
