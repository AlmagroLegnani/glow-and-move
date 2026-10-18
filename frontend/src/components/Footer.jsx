import './Footer.css';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          Glow <span>&</span> Move
          <p>{t('footer.tagline')}</p>
        </div>

        <nav className="footer__links">
          <a href="#home">{t('footer.home')}</a>
          <a href="#planes">{t('footer.plans')}</a>
          <a href="#nosotros">{t('footer.about')}</a>
          <a href="#contacto">{t('footer.contact')}</a>
        </nav>

        <p className="footer__copy">© {new Date().getFullYear()} Glow &amp; Move. {t('footer.rights')}</p>
      </div>
    </footer>
  );
}
