import { useState } from 'react';
import { useReveal } from '../hooks/useReveal';
import contactPhoto from '../assets/photos/contact.jpg';
import './Contact.css';
import { useI18n } from '../i18n/I18nContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Contact() {
  const revealRef = useReveal();
  const { t } = useI18n();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, comments: form.message }),
      });
      if (!res.ok) throw new Error('request failed');
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  }

  return (
    <section id="contacto" className="contact">
      <div className="container contact__grid reveal" ref={revealRef}>
        <div className="contact__media">
          <img src={contactPhoto} alt={t('contact.photoAlt')} className="contact__photo" />
        </div>

        <div className="contact__panel">
          <span className="eyebrow">{t('contact.eyebrow')}</span>
          <h2 className="contact__title">{t('contact.title')}</h2>
          <p className="contact__text">
            {t('contact.text')}
          </p>

          <form className="contact__form" onSubmit={handleSubmit}>
            <div className="contact__field">
              <label htmlFor="name">{t('contact.name')}</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder={t('contact.namePlaceholder')}
              />
            </div>

            <div className="contact__field">
              <label htmlFor="email">{t('common.email')}</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder={t('contact.emailPlaceholder')}
              />
            </div>

            <div className="contact__field">
              <label htmlFor="message">{t('contact.message')}</label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                value={form.message}
                onChange={handleChange}
                placeholder={t('contact.messagePlaceholder')}
              />
            </div>

            <button type="submit" className="btn btn-primary contact__submit" disabled={status === 'sending'}>
              {status === 'sending' ? t('contact.sending') : t('contact.send')}
            </button>

            {status === 'sent' && <p className="contact__feedback contact__feedback--ok">{t('contact.sent')}</p>}
            {status === 'error' && <p className="contact__feedback contact__feedback--error">{t('contact.error')}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
