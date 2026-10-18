import { useReveal } from '../hooks/useReveal';
import about1 from '../assets/photos/about-1.jpg';
import about2 from '../assets/photos/about-2.jpg';
import story from '../assets/photos/story.jpg';
import './About.css';
import { useI18n } from '../i18n/I18nContext.jsx';

// Los textos de cada programa están en i18n (about.programs), en el mismo orden que las fotos.
const PROGRAM_PHOTOS = [about1, about2, story];

export default function About() {
  const revealIntro = useReveal();
  const revealCards = useReveal();
  const { t } = useI18n();
  const programs = t('about.programs').map((p, i) => ({ ...p, photo: PROGRAM_PHOTOS[i] }));

  return (
    <section id="nosotros" className="about">
      <div className="container about__intro reveal" ref={revealIntro}>
        <span className="eyebrow">{t('about.eyebrow')}</span>
        <h2 className="about__title">{t('about.title')}</h2>
        <p className="about__text">
          {t('about.text')}
        </p>
      </div>

      <div className="container about__grid reveal" ref={revealCards}>
        {programs.map((program) => (
          <article key={program.title} className="about__card">
            <img src={program.photo} alt={program.title} className="about__card-photo" />
            <div className="about__card-body">
              <h3>{program.title}</h3>
              <p>{program.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
