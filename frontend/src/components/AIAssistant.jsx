import { useState } from 'react';
import './AIAssistant.css';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="ai-assistant">
      {open && (
        <div className="ai-assistant__panel">
          <div className="ai-assistant__header">
            <span>{t('ai.title')}</span>
            <button type="button" aria-label={t('common.close')} onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <div className="ai-assistant__body">
            <p>{t('ai.question')}</p>
            <p className="ai-assistant__soon">{t('ai.soon')}</p>
          </div>
          <div className="ai-assistant__input">
            <input type="text" placeholder={t('ai.placeholder')} disabled />
            <button type="button" disabled>
              {t('ai.send')}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="ai-assistant__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('ai.open')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.2-3.6A7.96 7.96 0 0 1 4 12Z" strokeLinejoin="round" />
          <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </div>
  );
}
