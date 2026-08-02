import { useState } from 'react';
import Modal from './Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

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
      <Modal title="Recuperar contraseña" onClose={onClose}>
        <p className="modal__success">
          Si <strong>{email}</strong> está registrado, te enviamos un email con un link para elegir una
          contraseña nueva.
        </p>
        <button type="button" className="btn btn-primary" onClick={onBackToLogin}>
          Volver a iniciar sesión
        </button>
      </Modal>
    );
  }

  return (
    <Modal title="Recuperar contraseña" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
          Ingresá el email de tu cuenta y te mandamos un link para restablecer la contraseña.
        </p>
        <div className="field">
          <label htmlFor="forgotEmail">Email</label>
          <input
            id="forgotEmail"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && <p className="modal__error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar link de recuperación'}
        </button>

        <p className="modal__switch">
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
  const [mode, setMode] = useState('login'); // login | register | forgot
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    nationality: '',
    phone: '',
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
      } else {
        await register(form);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'forgot') {
    return <ForgotPasswordForm onBackToLogin={() => setMode('login')} onClose={onClose} />;
  }

  return (
    <Modal title={mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} />
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={handleChange}
          />
        </div>

        {mode === 'register' && (
          <div className="field">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </div>
        )}

        {mode === 'login' && (
          <p className="modal__switch" style={{ textAlign: 'right', marginTop: '-0.6rem' }}>
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

        {error && <p className="modal__error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Un momento...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
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
