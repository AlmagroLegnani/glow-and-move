import AccountNav from './AccountNav.jsx';
import './AccountPages.css';

export default function AccountShell({ active, children }) {
  return (
    <div className="account-page">
      <div className="container account-page__inner">
        <a className="account-page__home" href="/">
          ← Volver al inicio
        </a>
        <AccountNav active={active} />
        <div className="account-page__content">{children}</div>
      </div>
    </div>
  );
}
