import { useCountUp } from '../hooks/useCountUp';

export default function StatItem({ value, label }) {
  const target = Number(value.replace(/\D/g, ''));
  const suffix = value.replace(/[\d.]/g, '');
  const [ref, count] = useCountUp(target);

  return (
    <div className="stats__item" ref={ref}>
      <strong>
        {count.toLocaleString('es-UY')}
        {suffix}
      </strong>
      <span>{label}</span>
    </div>
  );
}
