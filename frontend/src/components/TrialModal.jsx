import { useState } from 'react';
import Modal from './Modal.jsx';
import PasswordField from './PasswordField.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function TrialModal({ onClose, onSuccess }) {
  const { startTrial } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    documentId: '',
    nationality: '',
    phone: '',
    email: '',
    password: '',
    routineChoice: 'tren_superior',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await startTrial(form);
      setDone(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Modal title="Prueba gratis" onClose={onClose}>
        <p className="modal__success">
          ¡Listo! Arrancó tu semana de prueba con la experiencia Full, libre de anuncios. Te enviamos tu
          usuario y contraseña por WhatsApp y email.
        </p>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Cerrar
        </button>
      </Modal>
    );
  }

  return (
    <Modal title="Prueba gratis 7 días" onClose={onClose}>
      <p className="modal__subtitle">Plan Full — sin anuncios</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="modal__row">
          <div className="field">
            <label htmlFor="tfirstName">Nombre</label>
            <input id="tfirstName" name="firstName" required value={form.firstName} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="tlastName">Apellido</label>
            <input id="tlastName" name="lastName" required value={form.lastName} onChange={handleChange} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="documentId">CI / DNI / Pasaporte</label>
          <input id="documentId" name="documentId" value={form.documentId} onChange={handleChange} />
        </div>

        <div className="modal__row">
          <div className="field">
            <label htmlFor="nationality">Nacionalidad</label>
            <input id="nationality" name="nationality" value={form.nationality} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="phone">Celular</label>
            <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="temail">Email</label>
          <input id="temail" name="email" type="email" required value={form.email} onChange={handleChange} />
        </div>

        <PasswordField
          id="tpassword"
          name="password"
          label="Elegí una contraseña"
          required
          minLength={6}
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
        />

        <div className="field">
          <label htmlFor="routineChoice">Rutina</label>
          <select id="routineChoice" name="routineChoice" value={form.routineChoice} onChange={handleChange}>
            <option value="tren_superior">Tren superior (3 días)</option>
            <option value="tren_inferior">Tren inferior (3 días)</option>
          </select>
        </div>

        {error && <p className="modal__error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Un momento...' : 'Comenzar experiencia'}
        </button>
      </form>
    </Modal>
  );
}
