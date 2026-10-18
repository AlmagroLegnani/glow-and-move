import { useState } from 'react';
import Modal from './Modal.jsx';
import { AvatarPicker } from './AvatarPicker.jsx';
import PasswordField from './PasswordField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import mascotImg from '../assets/mascot/mascot.jpg';

const authMedia = (
  <div className="auth__avatar" aria-hidden="true">
    <span>
      <img src={mascotImg} alt="" />
    </span>
  </div>
);

const MailIcon = (
  <svg className="input-icon__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

const LockIcon = (
  <svg className="input-icon__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="10" width="16" height="11" rx="3" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

function SubmitLabel({ loading, loadingText, children }) {
  if (loading) {
    return (
      <>
        <span className="auth__spinner" aria-hidden="true" />
        {loadingText}
      </>
    );
  }
  return (
    <>
      {children}
      <svg className="auth__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </>
  );
}

function ForgotPasswordForm({ onBackToLogin, onClose }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Modal title={t('auth.checkEmailTitle')} variant="auth" media={authMedia} onClose={onClose}>
        <p className="modal__success">
          {t('auth.checkEmailBefore')} <strong>{email}</strong> {t('auth.checkEmailAfter')}
        </p>
        <button type="button" className="btn btn-primary" onClick={onBackToLogin}>
          <SubmitLabel>{t('auth.backToLogin')}</SubmitLabel>
        </button>
      </Modal>
    );
  }

  return (
    <Modal
      title={t('auth.forgotTitle')}
      subtitle={t('auth.forgotSubtitle')}
      variant="auth"
      media={authMedia}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="auth__form">
        <div className="field">
          <label htmlFor="forgotEmail">{t('common.email')}</label>
          <div className="input-icon">
            {MailIcon}
            <input
              id="forgotEmail"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={t('common.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="modal__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          <SubmitLabel loading={loading} loadingText={t('auth.sending')}>
            {t('auth.sendLink')}
          </SubmitLabel>
        </button>

        <p className="modal__switch">
          {t('auth.rememberedIt')}{' '}
          <button type="button" onClick={onBackToLogin}>
            {t('auth.backToLogin')}
          </button>
        </p>
      </form>
    </Modal>
  );
}

export default function AuthModal({ onClose, onSuccess }) {
  const { login, register } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState('login'); // login | register | forgot | avatar
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    nationality: '',
    phone: '',
    heightCm: '',
    weightKg: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError(t('common.passwordsMismatch'));
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        onSuccess?.();
        onClose();
      } else {
        await register({ ...form, heightCm: Number(form.heightCm), weightKg: Number(form.weightKg) });
        // Cuenta recién creada: ofrecemos elegir avatar antes de cerrar.
        setMode('avatar');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'avatar') {
    return (
      <Modal
        title={t('auth.avatarTitle')}
        subtitle={t('auth.avatarSubtitle')}
        variant="auth"
        onClose={() => {
          onSuccess?.();
          onClose();
        }}
      >
        <AvatarPicker
          skipLabel={t('common.notNow')}
          onDone={() => {
            onSuccess?.();
            onClose();
          }}
        />
      </Modal>
    );
  }

  if (mode === 'forgot') {
    return <ForgotPasswordForm onBackToLogin={() => setMode('login')} onClose={onClose} />;
  }

  return (
    <Modal
      title={mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
      subtitle={
        mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')
      }
      variant="auth"
      media={authMedia}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="auth__form">
        {mode === 'register' && (
          <div className="modal__row">
            <div className="field">
              <label htmlFor="firstName">{t('common.firstName')}</label>
              <input id="firstName" name="firstName" required value={form.firstName} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="lastName">{t('common.lastName')}</label>
              <input id="lastName" name="lastName" required value={form.lastName} onChange={handleChange} />
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="email">{t('common.email')}</label>
          <div className="input-icon">
            {MailIcon}
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={t('common.emailPlaceholder')}
              value={form.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <PasswordField
          id="password"
          name="password"
          label={t('common.password')}
          required
          minLength={6}
          value={form.password}
          onChange={handleChange}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          icon={LockIcon}
          placeholder="••••••••"
        />

        {mode === 'register' && (
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label={t('common.confirmPassword')}
            required
            minLength={6}
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            icon={LockIcon}
            placeholder="••••••••"
          />
        )}

        {mode === 'login' && (
          <p className="auth__forgot">
            <button type="button" onClick={() => setMode('forgot')}>
              {t('auth.forgot')}
            </button>
          </p>
        )}

        {mode === 'register' && (
          <div className="modal__row">
            <div className="field">
              <label htmlFor="nationality">{t('common.nationality')}</label>
              <input id="nationality" name="nationality" value={form.nationality} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="phone">{t('common.whatsapp')}</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
          </div>
        )}

        {mode === 'register' && (
          <div className="modal__row">
            <div className="field">
              <label htmlFor="weightKg">{t('common.weightEst')}</label>
              <input
                id="weightKg"
                name="weightKg"
                type="number"
                min="1"
                step="0.1"
                required
                value={form.weightKg}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label htmlFor="heightCm">{t('common.heightEst')}</label>
              <input
                id="heightCm"
                name="heightCm"
                type="number"
                min="1"
                step="0.1"
                required
                value={form.heightCm}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="modal__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          <SubmitLabel loading={loading} loadingText={t('common.oneMoment')}>
            {mode === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')}
          </SubmitLabel>
        </button>

        <p className="modal__switch">
          {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? t('auth.register') : t('auth.login')}
          </button>
        </p>
      </form>
    </Modal>
  );
}
