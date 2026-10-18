import { useState } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function WeightUpdateForm({ token, refreshMe }) {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.logWeight({ weightKg: Number(value) }, token);
      await refreshMe();
      setSaved(true);
      setValue('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div className="field" style={{ maxWidth: '160px' }}>
        <label htmlFor="newWeight">{t('profile.weightLabel')}</label>
        <input
          id="newWeight"
          type="number"
          min="1"
          step="0.1"
          required
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
        />
      </div>
      <button type="submit" className="btn" disabled={saving}>
        {saving ? t('common.saving') : t('profile.weightUpdate')}
      </button>
      {error && <p className="modal__error">{error}</p>}
      {saved && <p className="modal__success">{t('profile.weightSaved')}</p>}
    </form>
  );
}
