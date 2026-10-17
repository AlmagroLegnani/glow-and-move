import './Modal.css';

export default function Modal({ title, subtitle, media, onClose, children, size, variant }) {
  const panelClass = ['modal__panel', size === 'lg' && 'modal__panel--lg', variant && `modal__panel--${variant}`]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="modal">
      <button className="modal__scrim" aria-label="Cerrar" onClick={onClose} />
      <div className={panelClass} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__header">
          {media}
          <div className="modal__heading">
            <h2>{title}</h2>
            {subtitle && <p className="modal__lede">{subtitle}</p>}
          </div>
          <button type="button" className="modal__close" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
