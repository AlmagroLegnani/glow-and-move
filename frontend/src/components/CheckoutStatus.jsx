import './CheckoutStatus.css';

import { useI18n } from '../i18n/I18nContext.jsx';

const STATUSES = ['exito', 'pendiente', 'error'];

export default function CheckoutStatus({ status }) {
  const { t } = useI18n();
  const key = STATUSES.includes(status) ? status : 'error';
  const title = t(`checkout.${key}.title`);
  const message = t(`checkout.${key}.message`);

  return (
    <div className="checkout-status">
      <div className="container checkout-status__card">
        <h1>{title}</h1>
        <p>{message}</p>
        <a className="btn btn-primary" href="/">
          {t('common.backHome')}
        </a>
      </div>
    </div>
  );
}
