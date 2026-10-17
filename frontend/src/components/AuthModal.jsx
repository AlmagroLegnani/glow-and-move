import { useState } from 'react';
import Modal from './Modal.jsx';
import { AvatarPicker } from './AvatarPicker.jsx';
import PasswordField from './PasswordField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
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
      <Modal title="Revisá tu email" variant="auth" media={authMedia} onClose={onClose}>
        <p className="modal__success">
          Si <strong>{email}</strong> está registrado, te enviamos un email con un link para elegir una
          contraseña nueva.
        </p>
        <button type="button" className="btn btn-primary" onClick={onBackToLogin}>
          <SubmitLabel>Volver a iniciar sesión</SubmitLabel>
        </button>
      </Modal>
    );
  }

  return (
    <Modal
      title="Recuperar contraseña"
      subtitle="Ingresá el email de tu cuenta y te mandamos un link para restablecerla."
      variant="auth"
      media={authMedia}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="auth__form">
        <div className="field">
          <label htmlFor="forgotEmail">Email</label>
          <div className="input-icon">
            {MailIcon}
            <input
              id="forgotEmail"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
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
          <SubmitLabel loading={loading} loadingText="Enviando...">
            Enviar link
          </SubmitLabel>
        </button>

        <p className="modal__switch">
          ¿Te acordaste?{' '}
          <button type="button" onClick={onBackToLogin}>
            Volver a iniciar sesión
          </button>
        </p>
      </form>
    </Modal>
  );
}

export default function AuthModal({ onClose, onSuccess }) {
  const { login, register } = useAuth();
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
      setError('Las contraseñas no coinciden');
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
        title="Elegí tu avatar"
        subtitle="Subí una foto, elegí un avatar o quedate con tu inicial. Lo podés cambiar cuando quieras."
        variant="auth"
        onClose={() => {
          onSuccess?.();
          onClose();
        }}
      >
        <AvatarPicker
          skipLabel="Ahora no"
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
      title={mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
      subtitle={
        mode === 'login'
          ? 'Qué bueno verte de nuevo. Ingresá para seguir con tus rutinas.'
          : 'Sumate a Glow & Move y empezá a entrenar a tu ritmo.'
      }
      variant="auth"
      media={authMedia}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="auth__form">
        {mode === 'register' && (
          <div className="modal__row">
            <div className="field">
              <label htmlFor="firstName">Nombre</label>
              <input id="firstName" name="firstName" required value={form.firstName} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="lastName">Apellido</label>
              <input id="lastName" name="lastName" required value={form.lastName} onChange={handleChange} />
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="input-icon">
            {MailIcon}
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <PasswordField
          id="password"
          name="password"
          label="Contraseña"
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
            label="Confirmar contraseña"
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
              ¿Olvidaste tu contraseña?
            </button>
          </p>
        )}

        {mode === 'register' && (
          <div className="modal__row">
            <div className="field">
              <label htmlFor="nationality">Nacionalidad</label>
              <input id="nationality" name="nationality" value={form.nationality} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="phone">WhatsApp</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
          </div>
        )}

        {mode === 'register' && (
          <div className="modal__row">
            <div className="field">
              <label htmlFor="weightKg">Peso estimado (kg)</label>
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
              <label htmlFor="heightCm">Altura estimada (cm)</label>
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
          <SubmitLabel loading={loading} loadingText="Un momento...">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </SubmitLabel>
        </button>

        <p className="modal__switch">
          {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
          </button>
        </p>
      </form>
    </Modal>
  );
}
