import { Fragment, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { api } from '../lib/api.js';
import mascotImg from '../assets/mascot/mascot.jpg';
import './AIAssistant.css';

const STORAGE_KEY = 'glowmove_ai_chat';
export const OPEN_ASSISTANT_EVENT = 'glowmove:open-assistant';

function loadHistory() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

// Formato mínimo para las respuestas de Gemini: **negrita**, listas con "- " o "* " y
// saltos de línea. Se arman elementos de React (sin HTML crudo), así no hay riesgo de XSS.
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
    chunk.startsWith('**') && chunk.endsWith('**') ? <strong key={i}>{chunk.slice(2, -2)}</strong> : <Fragment key={i}>{chunk}</Fragment>
  );
}

function FormattedText({ text }) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trimEnd();
    const item = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
    if (item) {
      if (!list) {
        list = [];
        blocks.push({ type: 'list', items: list, key: i });
      }
      list.push(item[1]);
      return;
    }
    list = null;
    if (line.trim()) blocks.push({ type: 'p', text: line, key: i });
  });
  return blocks.map((b) =>
    b.type === 'list' ? (
      <ul key={b.key}>
        {b.items.map((it, j) => (
          <li key={j}>{renderInline(it)}</li>
        ))}
      </ul>
    ) : (
      <p key={b.key}>{renderInline(b.text)}</p>
    )
  );
}

export default function AIAssistant() {
  const { token } = useAuth();
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null); // { text, retryable }
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* sin storage: la conversación dura mientras la página esté abierta */
    }
  }, [messages]);

  // Otros componentes (ej. el menú del navbar) pueden abrir el asistente con un evento.
  useEffect(() => {
    const openIt = () => setOpen(true);
    window.addEventListener(OPEN_ASSISTANT_EVENT, openIt);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, openIt);
  }, []);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, error, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text, base = messages) {
    const content = text.trim();
    if (!content || sending) return;
    const next = [...base, { role: 'user', text: content }];
    setMessages(next);
    setInput('');
    setError(null);
    setSending(true);
    try {
      const { reply } = await api.assistantChat({ messages: next, lang }, token);
      setMessages([...next, { role: 'assistant', text: reply }]);
    } catch (err) {
      const code = err.data?.code;
      setError({
        text: code === 'NOT_CONFIGURED' ? t('ai.notConfigured') : code === 'RATE_LIMITED' ? t('ai.rateLimited') : t('ai.error'),
        retryable: code !== 'NOT_CONFIGURED',
        pending: next,
      });
    } finally {
      setSending(false);
    }
  }

  function retry() {
    if (!error?.pending) return;
    const pending = error.pending;
    const last = pending[pending.length - 1];
    send(last.text, pending.slice(0, -1));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function reset() {
    setMessages([]);
    setError(null);
  }

  const suggestions = t('ai.suggestions');

  return (
    <div className="ai-assistant">
      {open && (
        <section className="ai-chat" role="dialog" aria-label={t('ai.title')}>
          <header className="ai-chat__header">
            <span className="ai-chat__avatar" aria-hidden="true">
              <img src={mascotImg} alt="" />
            </span>
            <div className="ai-chat__title">
              <strong>{t('ai.title')}</strong>
              <span>
                <span className="ai-chat__online" aria-hidden="true" />
                {t('ai.status')}
              </span>
            </div>
            {messages.length > 0 && (
              <button type="button" className="ai-chat__icon-btn" onClick={reset} aria-label={t('ai.newChat')} title={t('ai.newChat')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
                </svg>
              </button>
            )}
            <button type="button" className="ai-chat__icon-btn" onClick={() => setOpen(false)} aria-label={t('common.close')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div className="ai-chat__messages" ref={listRef} aria-live="polite">
            <div className="ai-msg ai-msg--assistant">
              <p>{t('ai.welcome')}</p>
            </div>

            {messages.length === 0 && (
              <div className="ai-chat__suggestions">
                {suggestions.map((s) => (
                  <button key={s} type="button" className="ai-chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ai-msg--${m.role}`}>
                {m.role === 'assistant' ? <FormattedText text={m.text} /> : <p>{m.text}</p>}
              </div>
            ))}

            {sending && (
              <div className="ai-msg ai-msg--assistant ai-msg--typing" aria-label={t('ai.typing')}>
                <span />
                <span />
                <span />
              </div>
            )}

            {error && (
              <div className="ai-chat__error" role="alert">
                <span>{error.text}</span>
                {error.retryable && (
                  <button type="button" onClick={retry}>
                    {t('ai.retry')}
                  </button>
                )}
              </div>
            )}
          </div>

          <form
            className="ai-chat__composer"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={1500}
              placeholder={t('ai.placeholder')}
              aria-label={t('ai.placeholder')}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button type="submit" className="ai-chat__send" disabled={!input.trim() || sending} aria-label={t('ai.send')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
          <p className="ai-chat__disclaimer">{t('ai.disclaimer')}</p>
        </section>
      )}

      <button
        type="button"
        className={`ai-assistant__toggle ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t('common.close') : t('ai.open')}
        aria-expanded={open}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.2-3.6A7.96 7.96 0 0 1 4 12Z" strokeLinejoin="round" />
            <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
          </svg>
        )}
      </button>
    </div>
  );
}
