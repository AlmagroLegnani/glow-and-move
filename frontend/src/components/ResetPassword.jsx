import { useState } from 'react';
import { api } from '../lib/api.js';
import PasswordField from './PasswordField.jsx';
import './CheckoutStatus.css';
import './Modal.css';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function ResetPassword() {
  const { t } = useI18n();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('common.passwordsMismatch'));
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({ token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="checkout-status">
        <div className="container checkout-status__card">
          <h1>{t('reset.invalidTitle')}</h1>
          <p>{t('reset.invalidText')}</p>
          <a className="btn btn-primary" href="/">
            {t('common.backHome')}
          </a>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="checkout-status">
        <div className="container checkout-status__card">
          <h1>{t('reset.doneTitle')}</h1>
          <p>{t('reset.doneText')}</p>
          <a className="btn btn-primary" href="/">
            {t('common.backHome')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-status">
      <div className="container checkout-status__card">
        <h1>{t('reset.title')}</h1>
        <form
          onSubmit={handleSubmit}
          className="modal__body"
          style={{ width: '100%', textAlign: 'left' }}
        >
          <PasswordField
            id="password"
            label={t('reset.newPassword')}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordField
            id="confirmPassword"
            label={t('common.confirmPassword')}
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          {error && <p className="modal__error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('common.saving') : t('reset.save')}
          </button>
        </form>
      </div>
    </div>
  );
}
