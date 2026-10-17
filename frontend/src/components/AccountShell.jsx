import AccountTopbar from './AccountTopbar.jsx';
import InactivePlanBanner from './InactivePlanBanner.jsx';
import './AccountPages.css';

export default function AccountShell({ active, children }) {
  return (
    <div className="account-page">
      <AccountTopbar active={active} />

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
