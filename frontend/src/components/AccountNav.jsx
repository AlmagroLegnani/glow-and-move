import { useAuth } from '../context/AuthContext.jsx';
import './AccountNav.css';

const USER_ITEMS = [
  { id: 'plan', label: 'Mi plan (Mi experiencia)', href: '/mi-plan' },
  { id: 'videos', label: 'Mis videos', href: '/mis-videos' },
  { id: 'rutina', label: 'Mi rutina', href: '/mi-rutina' },
  { id: 'bitacora', label: 'Mi bitácora', href: '/mi-bitacora' },
];

// El admin no entrena: su sección principal es el panel de administración, y "Mi plan"
// pasa a ser su perfil. No ve videos, rutina ni bitácora.
const ADMIN_ITEMS = [
  { id: 'admin', label: 'Administración', href: '/admin' },
  { id: 'plan', label: 'Mi perfil', href: '/mi-plan' },
];

export default function AccountNav({ active }) {
  const { user } = useAuth();
  const items = user?.role === 'admin' ? ADMIN_ITEMS : USER_ITEMS;

  return (
    <nav className="account-nav" aria-label="Mi cuenta">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className={`account-nav__link ${active === item.id ? 'account-nav__link--active' : ''}`}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
