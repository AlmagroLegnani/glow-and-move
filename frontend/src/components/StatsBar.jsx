import { useReveal } from '../hooks/useReveal';
import './StatsBar.css';

const STATS = [
  { value: '2.400+', label: 'personas entrenando' },
  { value: '50+', label: 'rutinas guiadas' },
  { value: '13+', label: 'años de experiencia combinada' },
  { value: '10+', label: 'disciplinas para todo nivel' },
];

export default function StatsBar() {
  const revealRef = useReveal();

  return (
    <section className="stats reveal" ref={revealRef}>
      <div className="container stats__grid">
        {STATS.map((stat) => (
          <div key={stat.label} className="stats__item">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
