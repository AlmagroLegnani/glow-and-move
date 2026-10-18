import { useState } from 'react';
import Modal from './Modal.jsx';
import { AvatarPicker } from './AvatarPicker.jsx';
import PasswordField from './PasswordField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function TrialModal({ onClose, onSuccess }) {
  const { startTrial } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    documentId: '',
    nationality: '',
    phone: '',
    email: '',
    password: '',
    routineChoice: 'tren_superior',
    heightCm: '',
    weightKg: '',
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
      await startTrial({ ...form, heightCm: Number(form.heightCm), weightKg: Number(form.weightKg) });
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
      <Modal title={t('trial.doneTitle')} onClose={onClose}>
        <p className="modal__success">
          {t('trial.doneText')}
        </p>
        <p className="modal__subtitle">{t('trial.chooseAvatar')}</p>
        <AvatarPicker skipLabel={t('common.notNow')} onDone={onClose} />
      </Modal>
    );
  }

  return (
    <Modal title={t('trial.title')} onClose={onClose}>
      <p className="modal__subtitle">{t('trial.subtitle')}</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="modal__row">
          <div className="field">
            <label htmlFor="tfirstName">{t('common.firstName')}</label>
            <input id="tfirstName" name="firstName" required value={form.firstName} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="tlastName">{t('common.lastName')}</label>
            <input id="tlastName" name="lastName" required value={form.lastName} onChange={handleChange} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="documentId">{t('trial.document')}</label>
          <input id="documentId" name="documentId" value={form.documentId} onChange={handleChange} />
        </div>

        <div className="modal__row">
          <div className="field">
            <label htmlFor="nationality">{t('common.nationality')}</label>
            <input id="nationality" name="nationality" value={form.nationality} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="phone">{t('trial.phone')}</label>
            <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="temail">{t('common.email')}</label>
          <input id="temail" name="email" type="email" required value={form.email} onChange={handleChange} />
        </div>

        <div className="modal__row">
          <div className="field">
            <label htmlFor="tweightKg">{t('common.weightEst')}</label>
            <input
              id="tweightKg"
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
            <label htmlFor="theightCm">{t('common.heightEst')}</label>
            <input
              id="theightCm"
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

        <PasswordField
          id="tpassword"
          name="password"
          label={t('trial.choosePassword')}
          required
          minLength={6}
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
        />

        <div className="field">
          <label htmlFor="routineChoice">{t('trial.routine')}</label>
          <select id="routineChoice" name="routineChoice" value={form.routineChoice} onChange={handleChange}>
            <option value="tren_superior">{t('trial.upper')}</option>
            <option value="tren_inferior">{t('trial.lower')}</option>
          </select>
        </div>

        {error && <p className="modal__error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t('common.oneMoment') : t('trial.start')}
        </button>
      </form>
    </Modal>
  );
}
