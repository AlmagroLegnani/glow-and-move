import { useCountUp } from '../hooks/useCountUp';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function StatItem({ value, label }) {
  const target = Number(value.replace(/\D/g, ''));
  const suffix = value.replace(/[\d.]/g, '');
  const [ref, count] = useCountUp(target);
  const { locale } = useI18n();

  return (
    <div className="stats__item" ref={ref}>
      <strong>
        {count.toLocaleString(locale)}
        {suffix}
      </strong>
      <span>{label}</span>
    </div>
  );
}
