import { useState } from 'react';
import './AIAssistant.css';

export default function AIAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <div className="ai-assistant">
      {open && (
        <div className="ai-assistant__panel">
          <div className="ai-assistant__header">
            <span>Asistente IA</span>
            <button type="button" aria-label="Cerrar" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <div className="ai-assistant__body">
            <p>¿Tienes una consulta sobre tu plan o tu rutina?</p>
            <p className="ai-assistant__soon">El chat con el asistente estará disponible próximamente.</p>
          </div>
          <div className="ai-assistant__input">
            <input type="text" placeholder="Escribí tu consulta..." disabled />
            <button type="button" disabled>
              Enviar
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="ai-assistant__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir asistente IA"
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
