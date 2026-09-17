import { useState } from 'react';
import mascotAvatar from '../assets/photos/mascot-avatar.jpg';
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
        <img src={mascotAvatar} alt="" className="ai-assistant__avatar" />
      </button>
    </div>
  );
}
