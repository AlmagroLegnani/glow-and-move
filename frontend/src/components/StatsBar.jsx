import { useReveal } from '../hooks/useReveal';
import StatItem from './StatItem.jsx';
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
          <StatItem key={stat.label} value={stat.value} label={stat.label} />
        ))}
      </div>
    </section>
  );
}
