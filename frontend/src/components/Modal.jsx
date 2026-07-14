import './Modal.css';

export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal">
      <button className="modal__scrim" aria-label="Cerrar" onClick={onClose} />
      <div className="modal__panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__header">
          <h2>{title}</h2>
          <button type="button" className="modal__close" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
