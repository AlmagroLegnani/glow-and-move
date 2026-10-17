import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import AccountNav from './AccountNav.jsx';
import InactivePlanBanner from './InactivePlanBanner.jsx';
import UserAvatar from './UserAvatar.jsx';
import mascotLogo from '../assets/mascot/mascot.jpg';
import './AccountPages.css';

export default function AccountShell({ active, children }) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="account-page">
      <header className={`account-topbar ${scrolled ? 'account-topbar--scrolled' : ''}`}>
        <div className="container account-topbar__inner">
          <a className="account-topbar__home" href="/" aria-label="Volver al inicio de Glow & Move">
            <span className="account-topbar__back" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
            </span>
            <span className="account-topbar__brand">
              <span className="account-topbar__logo" aria-hidden="true">
                <img src={mascotLogo} alt="" />
              </span>
              <span className="account-topbar__brand-text">
                <strong>Glow &amp; Move</strong>
                <small>Volver al inicio</small>
              </span>
            </span>
          </a>

          <div className="account-topbar__nav">
            <AccountNav active={active} />
          </div>

          {user && (
            <a className="account-topbar__me" href="/mi-plan" aria-label="Mi plan">
              <UserAvatar user={user} size={40} />
            </a>
          )}
        </div>
      </header>

      <div className="container account-page__inner">
        <div className="account-page__content">
          {/* En Mi plan la tarjeta del plan y la de renovación ya lo explican. */}
          {active !== 'plan' && <InactivePlanBanner />}
          {children}
        </div>
      </div>
    </div>
  );
}
