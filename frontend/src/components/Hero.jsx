import heroPhoto from '../assets/photos/hero.jpg';
import './Hero.css';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function Hero() {
  const { t } = useI18n();
  return (
    <section id="home" className="hero">
      <div className="hero__brandbar">
        <h1 className="hero__brand">
          Glow <span>&amp;</span> Move
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
