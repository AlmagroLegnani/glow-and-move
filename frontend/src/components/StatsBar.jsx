import { useReveal } from '../hooks/useReveal';
import StatItem from './StatItem.jsx';
import './StatsBar.css';
import { useI18n } from '../i18n/I18nContext.jsx';

const STATS = [
  { value: '2.400+', key: 'people' },
  { value: '50+', key: 'routines' },
  { value: '13+', key: 'years' },
  { value: '10+', key: 'disciplines' },
];

export default function StatsBar() {
  const revealRef = useReveal();
  const { t } = useI18n();

  return (
    <section className="stats reveal" ref={revealRef}>
      <div className="container stats__grid">
        {STATS.map((stat) => (
          <StatItem key={stat.key} value={stat.value} label={t(`stats.${stat.key}`)} />
        ))}
      </div>
    </section>
  );
}
