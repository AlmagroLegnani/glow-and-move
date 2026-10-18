import { useAuth } from '../context/AuthContext.jsx';
import { isSubscriptionInactive } from '../lib/subscription.js';
import './InactivePlanBanner.css';
import { useI18n } from '../i18n/I18nContext.jsx';

// Cartel de "plan inactivo": el usuario conserva lo que ya pagó (rutinas, bitácora) pero no
// puede registrar entrenamientos nuevos hasta renovar. Se muestra solo si corresponde.
export default function InactivePlanBanner({ showCta = true }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const subscription = user?.subscriptions?.[0];
  if (!isSubscriptionInactive(subscription)) return null;

  const isTrial = subscription.status === 'trial';

  return (
    <div className="inactive-banner" role="alert">
      <span className="inactive-banner__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10" width="16" height="11" rx="3" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
      <div className="inactive-banner__text">
        <strong>{isTrial ? t('account.trialEndedTitle') : t('account.inactiveTitle')}</strong>
        <span>{t('account.inactiveText', { action: isTrial ? t('account.inactiveActionPlan') : t('account.inactiveActionPay') })}</span>
      </div>
      {showCta && (
        <a className="inactive-banner__cta" href={isTrial ? '/#planes' : '/mi-plan#renovar'}>
          {isTrial ? t('account.choosePlan') : t('account.updatePayment')}
        </a>
      )}
    </div>
  );
}
