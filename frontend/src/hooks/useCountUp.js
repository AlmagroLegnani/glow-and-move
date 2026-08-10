import { useEffect, useRef, useState } from 'react';

/**
 * Anima un número de 0 a `target` una vez que el elemento entra en viewport.
 * Devuelve [ref, valorActual].
 */
export function useCountUp(target, { duration = 1400, threshold = 0.4 } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);

          const start = performance.now();
          function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target, duration, threshold]);

  return [ref, value];
}
