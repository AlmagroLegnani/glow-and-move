import { useAuth } from '../context/AuthContext.jsx';
import './AccountNav.css';
import { useI18n } from '../i18n/I18nContext.jsx';

const USER_ITEMS = [
  { id: 'plan', labelKey: 'plan', href: '/mi-plan' },
  { id: 'videos', labelKey: 'videos', href: '/mis-videos' },
  { id: 'rutina', labelKey: 'rutina', href: '/mi-rutina' },
  { id: 'bitacora', labelKey: 'bitacora', href: '/mi-bitacora' },
  { id: 'servicios', labelKey: 'servicios', href: '/mis-servicios' },
];

// El admin no entrena: su sección principal es el panel de administración, y "Mi plan"
// pasa a ser su perfil. No ve videos, rutina ni bitácora.
const ADMIN_ITEMS = [
  { id: 'admin', labelKey: 'admin', href: '/admin' },
  { id: 'plan', labelKey: 'profile', href: '/mi-plan' },
];

export default function AccountNav({ active }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const items = user?.role === 'admin' ? ADMIN_ITEMS : USER_ITEMS;

  return (
    <nav className="account-nav" aria-label={t('account.navLabel')}>
      {items.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className={`account-nav__link ${active === item.id ? 'account-nav__link--active' : ''}`}
        >
          {t(`account.tabs.${item.labelKey}`)}
        </a>
      ))}
    </nav>
  );
}
