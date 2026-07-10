import { useEffect, useState } from 'react';
import './Navbar.css';

const TICKER_MESSAGES = [
  'Prueba gratis 7 días, plan Full/Premium sin anuncios',
  'Rutinas nuevas cada semana',
  'Entrená donde estés, a tu ritmo',
];

const LANGUAGES = [
  { code: 'ES', label: 'Español' },
  { code: 'EN', label: 'English' },
  { code: 'PT', label: 'Português' },
];

const MENU_ITEMS = [
  { letter: 'a', label: 'Iniciar sesión', href: '#' },
  { letter: 'b', label: 'Prueba gratis sin anuncios', href: '#planes' },
  { letter: 'c', label: 'Planes', href: '#planes' },
  { letter: 'd', label: 'Términos y condiciones', href: '#' },
  { letter: 'e', label: 'Convenios', href: '#' },
  { letter: 'f', label: 'Otros servicios y videos de bienestar', href: '#' },
  { letter: 'g', label: 'Gym Shop online', href: '#' },
  { letter: 'h', label: 'Contacto', href: '#contacto' },
  { letter: 'i', label: 'Ayuda — Asistente IA', href: '#' },
];

const BUILT_HREFS = new Set(['#planes', '#contacto']);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState('ES');
  const [tickerIndex, setTickerIndex] = useState(0);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTickerIndex((i) => (i + 1) % TICKER_MESSAGES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  function showComingSoon(label) {
    setToast(`${label}: disponible próximamente`);
  }

  function handleMenuItemClick(e, item) {
    setMenuOpen(false);
    if (!BUILT_HREFS.has(item.href)) {
      e.preventDefault();
      showComingSoon(item.label);
    }
  }

  function handleLangSelect(code) {
    if (code === 'ES') {
      setLang(code);
    } else {
      showComingSoon(`Traducción a ${code}`);
    }
  }

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        <button
          type="button"
          className="navbar__profile"
          onClick={() => showComingSoon('Mi perfil')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="8" r="3.4" />
            <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" strokeLinecap="round" />
          </svg>
          <span>Mi perfil</span>
        </button>

        <div className="navbar__ticker" aria-live="polite">
          <span key={tickerIndex} className="navbar__ticker-text">
            {TICKER_MESSAGES[tickerIndex]}
          </span>
        </div>

        <div className="navbar__lang" role="group" aria-label="Traducir página">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              className={l.code === lang ? 'is-active' : ''}
              onClick={() => handleLangSelect(l.code)}
            >
              {l.code}
            </button>
          ))}
        </div>

        <button
          className={`navbar__toggle ${menuOpen ? 'is-open' : ''}`}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <nav className={`navbar__menu ${menuOpen ? 'navbar__menu--open' : ''}`}>
        {MENU_ITEMS.map((item) => (
          <a key={item.letter} href={item.href} onClick={(e) => handleMenuItemClick(e, item)}>
            <span className="navbar__menu-letter">{item.letter}</span>
            {item.label}
          </a>
        ))}
      </nav>
      {menuOpen && <button className="navbar__scrim" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}

      {toast && <div className="navbar__toast">{toast}</div>}
    </header>
  );
}
