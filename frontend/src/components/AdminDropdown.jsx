import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Desplegable propio para el panel de admin (reemplaza al <select> nativo, que en Windows
// muestra el menú azul del sistema). El menú se posiciona con `fixed` para que no lo recorten
// contenedores con overflow (como las tablas con scroll horizontal).
//
// options: [{ id, label, tone? }]  — tone: green | beige | dark | rose | orange | neutral
// variant: 'pill' (chip de color en tablas) | 'field' (campo de formulario a lo ancho)
export default function AdminDropdown({ value, options, onChange, variant = 'pill', ariaLabel, placeholder = 'Elegir' }) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const selectedIdx = options.findIndex((o) => String(o.id) === String(value));
  const selected = options[selectedIdx];
  const tone = selected?.tone || 'neutral';

  function place() {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(r.width, 180);
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < 260 && r.top > spaceBelow;
    setPos({
      left: Math.min(r.left, window.innerWidth - width - 8),
      width,
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
    });
  }

  function openMenu() {
    place();
    setActiveIdx(selectedIdx >= 0 ? selectedIdx : 0);
    setOpen(true);
  }

  function choose(idx) {
    const opt = options[idx];
    setOpen(false);
    btnRef.current?.focus();
    if (opt && String(opt.id) !== String(value)) onChange(opt.id);
  }

  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) {
      if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false);
    }
    function onScrollOrResize(e) {
      if (menuRef.current?.contains(e.target)) return; // scroll dentro del propio menú
      setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  // Mantiene visible la opción activa al navegar con el teclado.
  useLayoutEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector(`[data-idx="${activeIdx}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIdx]);

  function onKeyDown(e) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(activeIdx);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`ad-dd ad-dd--${variant} ${variant === 'pill' ? `ad-tone--${tone}` : ''} ${open ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        {variant === 'pill' && <span className="ad-dd__dot" aria-hidden="true" />}
        <span className="ad-dd__label">{selected ? selected.label : placeholder}</span>
        <svg className="ad-dd__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && pos && (
        <ul
          ref={menuRef}
          className="ad-dd__menu"
          role="listbox"
          aria-label={ariaLabel}
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
        >
          {options.map((o, idx) => (
            <li
              key={o.id}
              data-idx={idx}
              role="option"
              aria-selected={idx === selectedIdx}
              className={`ad-dd__option ${idx === activeIdx ? 'is-active' : ''} ${idx === selectedIdx ? 'is-selected' : ''}`}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(idx)}
            >
              {o.tone && <span className={`ad-dd__dot ad-tone--${o.tone}`} aria-hidden="true" />}
              <span className="ad-dd__option-label">{o.label}</span>
              {idx === selectedIdx && (
                <svg className="ad-dd__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12 5 5 9-10" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
