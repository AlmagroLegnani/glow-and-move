import { useRef } from 'react';
import heroPhoto from '../assets/photos/hero.jpg';
import './Hero.css';
import { useI18n } from '../i18n/I18nContext.jsx';

// Letras del título: cada una entra girando en profundidad con un pequeño desfase.
const BRAND = [
  ...'Glow'.split(''),
  ' ',
  { char: '&', accent: true },
  ' ',
  ...'Move'.split(''),
];

export default function Hero() {
  const { t } = useI18n();
  const brandRef = useRef(null);

  // Inclinación 3D del título siguiendo el puntero (solo mouse; en touch queda la animación sola).
  function handlePointerMove(e) {
    if (e.pointerType !== 'mouse') return;
    const el = brandRef.current;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--tilt-x', `${(-y * 18).toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${(x * 22).toFixed(2)}deg`);
  }

  function handlePointerLeave() {
    brandRef.current.style.setProperty('--tilt-x', '0deg');
    brandRef.current.style.setProperty('--tilt-y', '0deg');
  }
  return (
    <section id="home" className="hero">
      <div className="hero__brandbar" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
        <h1 className="hero__brand" ref={brandRef} aria-label="Glow & Move">
          <span className="hero__brand-3d" aria-hidden="true">
            {BRAND.map((item, i) => {
              const char = typeof item === 'string' ? item : item.char;
              if (char === ' ') return <span key={i} className="hero__brand-space" />;
              return (
                <span
                  key={i}
                  className={`hero__brand-char${item.accent ? ' hero__brand-char--accent' : ''}`}
                  style={{ '--i': i }}
                  data-char={char}
                >
                  {char}
                </span>
              );
            })}
          </span>
        </h1>
      </div>

      <div className="container">
        <div className="hero__frame">
          <img src={heroPhoto} alt={t('hero.photoAlt')} className="hero__photo" />
          <div className="hero__overlay" />
        </div>

        <blockquote className="hero__quote">
          {t('hero.quote')}
        </blockquote>

        <div className="hero__trial">
          <p className="hero__trial-text">
            {t('hero.trialTitle')}
          </p>
          <p className="hero__trial-note">
            {t('hero.trialNote')}
          </p>
          <a href="#planes" className="btn btn-primary hero__trial-cta">
            {t('hero.trialCta')}
          </a>
        </div>
      </div>
    </section>
  );
}
