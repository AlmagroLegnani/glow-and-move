import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { api } from '../lib/api.js';
import { serviceIcon } from '../lib/serviceIcons.js';
import { youtubeThumbnail } from '../lib/youtube.js';
import AccountShell from './AccountShell.jsx';
import './Modal.css';
import './MiRutinaPage.css';
import './MiBitacoraPage.css';
import './ExtraServices.css';
import './ServicePages.css';

function ServiceIcon({ slug, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={serviceIcon(slug)} />
    </svg>
  );
}

// ---------- /mis-servicios ----------

export function MyServicesPage() {
  const { user, token, loading } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api
      .services(token)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  if (loading || (user && !data && !error)) {
    return (
      <AccountShell active="servicios">
        <h1>{t('account.tabs.servicios')}</h1>
        <p className="profile__videos-hint">{t('common.loading')}</p>
      </AccountShell>
    );
  }

  if (!user) {
    return (
      <AccountShell active="servicios">
        <h1>{t('account.tabs.servicios')}</h1>
        <p className="profile__videos-hint">{t('services.loginToSee')}</p>
        <a className="btn btn-primary" href="/">
          {t('common.backHome')}
        </a>
      </AccountShell>
    );
  }

  const owned = data?.services.filter((s) => s.owned) || [];
  const available = data?.services.filter((s) => !s.owned) || [];

  return (
    <AccountShell active="servicios">
      <h1>{t('account.tabs.servicios')}</h1>
      {error && <p className="modal__error">{error}</p>}

      {data && data.reason === 'plan' && owned.length > 0 && (
        <div className="bt-callout">
          <div>
            <strong>{t('services.pausedTitle')}</strong>
            <span>{t('services.pausedText')}</span>
          </div>
          <a className="rt-btn rt-btn--primary" href="/mi-plan#renovar">
            {t('account.updatePayment')}
          </a>
        </div>
      )}

      {owned.length === 0 ? (
        <div className="rt-empty">
          <span className="rt-empty__icon" aria-hidden="true">
            <ServiceIcon slug="" size={26} />
          </span>
          <h2>{t('services.emptyTitle')}</h2>
          <p>{t('services.emptyText')}</p>
          <a className="rt-btn rt-btn--primary" href="/#servicios">
            {t('services.browse')}
          </a>
        </div>
      ) : (
        <div className="svc-list">
          {owned.map((s) => (
            <a key={s.slug} className="svc-row" href={`/servicios/${s.slug}`}>
              <span className="xs-card__icon">
                <ServiceIcon slug={s.slug} />
              </span>
              <span className="svc-row__text">
                <strong>{s.name}</strong>
                <span>{s.description}</span>
              </span>
              <span className="svc-row__arrow" aria-hidden="true">
                →
              </span>
            </a>
          ))}
        </div>
      )}

      {available.length > 0 && owned.length > 0 && (
        <a className="svc-more" href="/#servicios">
          {t('services.moreAvailable', { n: available.length })}
        </a>
      )}
    </AccountShell>
  );
}

// ---------- /servicios/:slug ----------

export function ServicePage({ slug }) {
  const { user, token, loading } = useAuth();
  const { t } = useI18n();
  const [state, setState] = useState({ status: 'loading', service: null, error: '' });
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');

  useEffect(() => {
    if (!token) return;
    api
      .service(slug, token)
      .then((service) => setState({ status: 'ready', service, error: '' }))
      .catch((err) => {
        const code = err.data?.code;
        if (code === 'NOT_OWNED' || code === 'PLAN_INACTIVE') {
          setState({ status: code, service: err.data.service, error: '' });
        } else {
          setState({ status: 'error', service: null, error: err.message });
        }
      });
  }, [slug, token]);

  async function buy() {
    setBuying(true);
    setBuyError('');
    try {
      const { initPoint } = await api.serviceCheckout(slug, token);
      window.location.href = initPoint;
    } catch (err) {
      setBuyError(err.message);
      setBuying(false);
    }
  }

  if (!loading && !user) {
    return (
      <AccountShell active="servicios">
        <h1>{t('account.tabs.servicios')}</h1>
        <p className="profile__videos-hint">{t('services.loginToSee')}</p>
        <a className="btn btn-primary" href="/">
          {t('common.backHome')}
        </a>
      </AccountShell>
    );
  }

  if (loading || state.status === 'loading') {
    return (
      <AccountShell active="servicios">
        <p className="profile__videos-hint">{t('common.loading')}</p>
      </AccountShell>
    );
  }

  if (state.status === 'error') {
    return (
      <AccountShell active="servicios">
        <p className="modal__error">{state.error}</p>
        <a className="svc-back" href="/mis-servicios">
          ← {t('account.tabs.servicios')}
        </a>
      </AccountShell>
    );
  }

  const { service } = state;

  const hero = (
    <section className="svc-hero">
      <span className="svc-hero__icon">
        <ServiceIcon slug={slug} size={30} />
      </span>
      <div>
        <span className="svc-hero__eyebrow">{t('services.eyebrow')}</span>
        <h1 className="svc-hero__title">{service.name}</h1>
        <p className="svc-hero__desc">{service.description}</p>
      </div>
    </section>
  );

  if (state.status === 'NOT_OWNED' || state.status === 'PLAN_INACTIVE') {
    const notOwned = state.status === 'NOT_OWNED';
    return (
      <AccountShell active="servicios">
        <a className="svc-back" href="/mis-servicios">
          ← {t('account.tabs.servicios')}
        </a>
        {hero}
        <div className="bt-callout">
          <div>
            <strong>{notOwned ? t('services.lockedTitle') : t('services.pausedTitle')}</strong>
            <span>{notOwned ? t('services.lockedText', { price: service.priceUsd.toFixed(2) }) : t('services.pausedText')}</span>
          </div>
          {notOwned ? (
            <button type="button" className="rt-btn rt-btn--primary" disabled={buying} onClick={buy}>
              {buying ? t('plans.redirecting') : t('services.add', { price: service.priceUsd.toFixed(2) })}
            </button>
          ) : (
            <a className="rt-btn rt-btn--primary" href="/mi-plan#renovar">
              {t('account.updatePayment')}
            </a>
          )}
        </div>
        {buyError && <p className="modal__error">{buyError}</p>}
      </AccountShell>
    );
  }

  return (
    <AccountShell active="servicios">
      <a className="svc-back" href="/mis-servicios">
        ← {t('account.tabs.servicios')}
      </a>
      {hero}

      {service.routine.length === 0 && service.videos.length === 0 && (
        <div className="rt-empty">
          <h2>{t('services.preparingTitle')}</h2>
          <p>{t('services.preparingText')}</p>
        </div>
      )}

      {service.routine.map((day) => (
        <section key={day.dayNumber} className="svc-day">
          <h2 className="svc-day__title">
            {t('routine.day', { n: day.dayNumber })}
            {day.label && <span> · {day.label}</span>}
          </h2>
          <ol className="rt-list">
            {day.exercises.map((ex, idx) => (
              <li key={ex.id} className="rt-ex">
                <div className="rt-ex__head">
                  <span className="rt-ex__num">{String(idx + 1).padStart(2, '0')}</span>
                  <h3 className="rt-ex__name">{ex.name}</h3>
                  {ex.videoUrl && (
                    <a className="rt-ex__video" href={ex.videoUrl} target="_blank" rel="noreferrer">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M8 5.5v13l11-6.5z" />
                      </svg>
                      {t('routine.watchVideo')}
                    </a>
                  )}
                </div>
                <dl className="rt-ex__stats">
                  <div>
                    <dt>{t('routine.sets')}</dt>
                    <dd>{ex.sets}</dd>
                  </div>
                  <div>
                    <dt>{t('routine.reps')}</dt>
                    <dd>{ex.reps}</dd>
                  </div>
                  <div>
                    <dt>{t('routine.weight')}</dt>
                    <dd>{ex.weight > 0 ? `${ex.weight} kg` : t('routine.bodyweight')}</dd>
                  </div>
                  <div>
                    <dt>{t('routine.rest')}</dt>
                    <dd>{ex.rest || '—'}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {service.videos.length > 0 && (
        <section className="svc-day">
          <h2 className="svc-day__title">{t('services.videosTitle')}</h2>
          <ul className="video-grid">
            {service.videos.map((v) => {
              const thumb = youtubeThumbnail(v.videoUrl);
              return (
                <li key={v.id}>
                  <a className="video-card" href={v.videoUrl} target="_blank" rel="noreferrer">
                    <span className="video-card__thumb">
                      {thumb && <img src={thumb} alt="" loading="lazy" />}
                      <span className="video-card__play" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                    <span className="video-card__info">
                      <span className="video-card__title">{v.title}</span>
                      {v.description && <span className="video-card__desc">{v.description}</span>}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </AccountShell>
  );
}
