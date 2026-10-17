import AccountNav from './AccountNav.jsx';
import InactivePlanBanner from './InactivePlanBanner.jsx';
import './AccountPages.css';

export default function AccountShell({ active, children }) {
  return (
    <div className="account-page">
      <div className="container account-page__inner">
        <a className="account-page__home" href="/">
          ← Volver al inicio
        </a>
        <AccountNav active={active} />
        <div className="account-page__content">
          {/* En Mi plan la tarjeta del plan y la de renovación ya lo explican. */}
          {active !== 'plan' && <InactivePlanBanner />}
          {children}
        </div>
      </div>
    </div>
  );
}
