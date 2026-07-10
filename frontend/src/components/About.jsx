import { useReveal } from '../hooks/useReveal';
import about1 from '../assets/photos/about-1.jpg';
import about2 from '../assets/photos/about-2.jpg';
import story from '../assets/photos/story.jpg';
import './About.css';

const PROGRAMS = [
  {
    photo: about1,
    title: 'Fuerza funcional',
    text: 'Rutinas de fuerza pensadas para el día a día: más energía, mejor postura y un cuerpo que responde.',
  },
  {
    photo: about2,
    title: 'Movilidad y calma',
    text: 'Sesiones de estiramiento y respiración para soltar tensión y recuperar entre entrenamientos.',
  },
  {
    photo: story,
    title: 'Para cada etapa',
    text: 'Adaptamos cada programa a tu momento de vida, tu nivel y tus tiempos, sin excepciones.',
  },
];

export default function About() {
  const revealIntro = useReveal();
  const revealCards = useReveal();

  return (
    <section id="nosotros" className="about">
      <div className="container about__intro reveal" ref={revealIntro}>
        <span className="eyebrow">Sobre nosotros</span>
        <h2 className="about__title">Programas</h2>
        <p className="about__text">
          Diseñamos rutinas para todos los niveles de entrenamiento, ya seas principiante o
          practicante experimentado. Nuestras sesiones se viven en un ambiente cálido y cercano,
          para que puedas enfocarte en tu progreso, ganar fuerza y encontrar claridad.
        </p>
      </div>

      <div className="container about__grid reveal" ref={revealCards}>
        {PROGRAMS.map((program) => (
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
