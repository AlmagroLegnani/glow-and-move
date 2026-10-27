// Cliente mínimo de la API de Gemini (endpoint generateContent). Sin SDK para no sumar
// dependencias: es un solo POST. El modelo se puede cambiar con GEMINI_MODEL sin tocar código.
const DEFAULT_MODEL = 'gemini-3.8-flash';
// Si el modelo principal está saturado (503/429), no existe o tarda demasiado, se prueba con
// estos en orden. Se pueden cambiar con GEMINI_FALLBACK_MODELS (separados por coma).
const DEFAULT_FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash'];
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

  let lastError;
  for (const model of modelChain()) {
    try {
      return await callModel({ apiKey, model, systemPrompt, history });
    } catch (err) {
      lastError = err;
      if (!err.retryable) throw err;
      console.warn(`Asistente IA: falló ${model}, probando el siguiente modelo.`, err.message);
    }
  }
  throw lastError;
}

module.exports = { generateReply };
