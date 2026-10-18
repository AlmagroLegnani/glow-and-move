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
import { useI18n, LANGUAGES } from '../i18n/I18nContext.jsx';
import { OPEN_ASSISTANT_EVENT } from './AIAssistant.jsx';

// El texto de cada ítem sale de i18n (nav.menu.<letra>).
const MENU_ITEMS = [
  { letter: 'a', action: 'auth' },
  { letter: 'b', action: 'trial' },
  { letter: 'c', href: '#planes' },
  { letter: 'd', href: '#' },
  { letter: 'e', href: '#' },
  { letter: 'f', href: '#servicios' },
  { letter: 'g', href: '#' },
  { letter: 'h', href: '#contacto' },
  { letter: 'i', action: 'assistant' },
];

const BUILT_HREFS = new Set(['#planes', '#contacto', '#servicios']);

export default function Navbar() {
  const { user, loading } = useAuth();
  const { t, lang, setLang } = useI18n();
  const tickerMessages = t('nav.ticker');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
      setTickerIndex((i) => (i + 1) % 3);
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
    setToast(t('common.comingSoon', { label }));
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
    if (item.action === 'assistant') {
      e.preventDefault();
      window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT));
      return;
    }
    if (item.action === 'trial') {
      e.preventDefault();
      setTrialModalOpen(true);
      return;
    }
    if (!BUILT_HREFS.has(item.href)) {
      e.preventDefault();
      showComingSoon(t(`nav.menu.${item.letter}`));
    }
  }


  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__ticker" aria-live="polite">
        <span key={tickerIndex} className="navbar__ticker-text">
          {tickerMessages[tickerIndex % tickerMessages.length]}
        </span>
      </div>

      <div className="navbar__inner container">
        <div className="navbar__logo-wrap" ref={logoMenuRef}>
          <button
            type="button"
            className="navbar__logo"
            aria-label={t('nav.accountMenu')}
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
                {t('nav.configureProfile')}
              </button>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoMenuOpen(false);
                    setAvatarModalOpen(true);
                  }}
                >
                  {t('nav.changeAvatar')}
                </button>
              )}
              {user?.role === 'admin' && (
                <a href="/admin" onClick={() => setLogoMenuOpen(false)}>
                  {t('nav.adminPanel')}
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
          <span>{user ? user.firstName : t('nav.myProfile')}</span>
        </button>

        {user && (
          <div className="navbar__account-nav">
            <AccountNav />
          </div>
        )}

        <div className="navbar__lang" role="group" aria-label={t('nav.translate')}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              className={l.code === lang ? 'is-active' : ''}
              aria-pressed={l.code === lang}
              lang={l.code}
              title={l.name}
              onClick={() => setLang(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <button
          className={`navbar__toggle ${menuOpen ? 'is-open' : ''}`}
          aria-label={t('nav.openMenu')}
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
            {t(`nav.menu.${item.letter}`)}
          </a>
        ))}
      </nav>
      {menuOpen && <button className="navbar__scrim" aria-label={t('nav.closeMenu')} onClick={() => setMenuOpen(false)} />}

      {toast && <div className="navbar__toast">{toast}</div>}

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
      {trialModalOpen && <TrialModal onClose={() => setTrialModalOpen(false)} />}
      {profileModalOpen && <ProfileModal onClose={() => setProfileModalOpen(false)} />}
      {avatarModalOpen && <AvatarPickerModal onClose={() => setAvatarModalOpen(false)} />}
    </header>
  );
}
