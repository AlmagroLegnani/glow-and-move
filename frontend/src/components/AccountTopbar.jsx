import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import AccountNav from './AccountNav.jsx';
import UserAvatar from './UserAvatar.jsx';
import mascotLogo from '../assets/mascot/mascot.jpg';
import './AccountPages.css';
import { useI18n } from '../i18n/I18nContext.jsx';

// Barra superior compartida por las páginas de cuenta y el panel de administración:
// volver al inicio + marca, pestañas de la cuenta y avatar.
export default function AccountTopbar({ active, wide = false }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`account-topbar ${scrolled ? 'account-topbar--scrolled' : ''} ${wide ? 'account-topbar--wide' : ''}`}>
      <div className="container account-topbar__inner">
        <a className="account-topbar__home" href="/" aria-label={t('account.backHomeAria')}>
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
              <small>{t('common.backHome')}</small>
            </span>
          </span>
        </a>

        <div className="account-topbar__nav">
          <AccountNav active={active} />
        </div>

        {user && (
          <a className="account-topbar__me" href="/mi-plan" aria-label={user.role === 'admin' ? t('account.tabs.profile') : t('account.myPlan')}>
            <UserAvatar user={user} size={40} />
          </a>
        )}
      </div>
    </header>
  );
}
