import { useEffect, useRef, useState } from 'react';
import './Navbar.css';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from './AuthModal.jsx';
import TrialModal from './TrialModal.jsx';
import ProfileModal from './ProfileModal.jsx';
import AccountNav from './AccountNav.jsx';
import mascotLogo from '../assets/mascot/mascot.jpg';
import UserAvatar from './UserAvatar.jsx';
import AvatarPickerModal from './AvatarPicker.jsx';

const TICKER_MESSAGES = [
  'Prueba gratis 7 días, plan Full sin anuncios',
  'Rutinas nuevas cada semana',
  'Entrená donde estés, a tu ritmo',
];

const LANGUAGES = [
  { code: 'ES', label: 'Español' },
  { code: 'EN', label: 'English' },
  { code: 'PT', label: 'Português' },
];

const MENU_ITEMS = [
  { letter: 'a', label: 'Iniciar sesión', action: 'auth' },
  { letter: 'b', label: 'Prueba gratis sin anuncios', action: 'trial' },
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
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState('ES');
  const [tickerIndex, setTickerIndex] = useState(0);
  const [toast, setToast] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const logoMenuRef = useRef(null);

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

  useEffect(() => {
    if (!logoMenuOpen) return undefined;
    function handleClickOutside(e) {
      if (logoMenuRef.current && !logoMenuRef.current.contains(e.target)) {
        setLogoMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [logoMenuOpen]);

  function showComingSoon(label) {
    setToast(`${label}: disponible próximamente`);
  }

  function handleProfileClick() {
    if (user) {
      setProfileModalOpen(true);
    } else {
      setAuthModalOpen(true);
    }
  }

  function handleMenuItemClick(e, item) {
    setMenuOpen(false);
    if (item.action === 'auth') {
      e.preventDefault();
      if (user) {
        setProfileModalOpen(true);
      } else {
        setAuthModalOpen(true);
      }
      return;
    }
    if (item.action === 'trial') {
      e.preventDefault();
      setTrialModalOpen(true);
      return;
    }
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
      <div className="navbar__ticker" aria-live="polite">
        <span key={tickerIndex} className="navbar__ticker-text">
          {TICKER_MESSAGES[tickerIndex]}
        </span>
      </div>

      <div className="navbar__inner container">
        <div className="navbar__logo-wrap" ref={logoMenuRef}>
          <button
            type="button"
            className="navbar__logo"
            aria-label="Menú de cuenta"
            aria-expanded={logoMenuOpen}
            onClick={() => setLogoMenuOpen((v) => !v)}
          >
            {/* Con sesión iniciada, el logo de la mascota se reemplaza por el avatar del usuario. */}
            {user ? <UserAvatar user={user} size={38} className="navbar__user-avatar" /> : <img src={mascotLogo} alt="" />}
          </button>

          {logoMenuOpen && (
            <div className="navbar__logo-menu">
              <button
                type="button"
                onClick={() => {
                  setLogoMenuOpen(false);
                  handleProfileClick();
                }}
              >
                Configurar perfil
              </button>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoMenuOpen(false);
                    setAvatarModalOpen(true);
                  }}
                >
                  Cambiar avatar
                </button>
              )}
              {user?.role === 'admin' && (
                <a href="/admin" onClick={() => setLogoMenuOpen(false)}>
                  Panel de administración
                </a>
              )}
            </div>
          )}
        </div>

        <button type="button" className="navbar__profile" onClick={handleProfileClick} disabled={loading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="8" r="3.4" />
            <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" strokeLinecap="round" />
          </svg>
          <span>{user ? user.firstName : 'Mi perfil'}</span>
        </button>

        {user && (
          <div className="navbar__account-nav">
            <AccountNav />
          </div>
        )}

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
          <a key={item.letter} href={item.href || '#'} onClick={(e) => handleMenuItemClick(e, item)}>
            <span className="navbar__menu-letter">{item.letter}</span>
            {item.label}
          </a>
        ))}
      </nav>
      {menuOpen && <button className="navbar__scrim" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}

      {toast && <div className="navbar__toast">{toast}</div>}

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
      {trialModalOpen && <TrialModal onClose={() => setTrialModalOpen(false)} />}
      {profileModalOpen && <ProfileModal onClose={() => setProfileModalOpen(false)} />}
      {avatarModalOpen && <AvatarPickerModal onClose={() => setAvatarModalOpen(false)} />}
    </header>
  );
}
