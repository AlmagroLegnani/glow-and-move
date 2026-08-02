import { useState } from 'react';
import { api } from '../lib/api.js';
import './CheckoutStatus.css';
import './Modal.css';

export default function ResetPassword() {
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
      setError('Las contraseñas no coinciden');
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
          <h1>Link inválido</h1>
          <p>Este link de recuperación no es válido. Pedí uno nuevo desde "Iniciar sesión".</p>
          <a className="btn btn-primary" href="/">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="checkout-status">
        <div className="container checkout-status__card">
          <h1>Contraseña actualizada</h1>
          <p>Ya podés iniciar sesión con tu nueva contraseña.</p>
          <a className="btn btn-primary" href="/">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-status">
      <div className="container checkout-status__card">
        <h1>Elegí tu nueva contraseña</h1>
        <form
          onSubmit={handleSubmit}
          className="modal__body"
          style={{ width: '100%', textAlign: 'left' }}
        >
          <div className="field">
            <label htmlFor="password">Contraseña nueva</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="modal__error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
