import './AccountNav.css';

const ITEMS = [
  { id: 'plan', label: 'Mi plan (Mi experiencia)', href: '/mi-plan' },
  { id: 'videos', label: 'Mis videos', href: '/mis-videos' },
  { id: 'rutina', label: 'Mi rutina', href: '/mi-rutina' },
  { id: 'bitacora', label: 'Mi bitácora', href: '/mi-bitacora' },
];

export default function AccountNav({ active }) {
  return (
    <nav className="account-nav" aria-label="Mi cuenta">
      {ITEMS.map((item) => (
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
