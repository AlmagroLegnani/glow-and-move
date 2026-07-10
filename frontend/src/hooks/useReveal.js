import { useEffect, useRef } from 'react';

/**
 * Agrega la clase "is-visible" cuando el elemento entra en viewport.
 * Sirve de fallback para navegadores sin soporte de animation-timeline: view().
 */
export function useReveal(options = { threshold: 0.15 }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, options);

    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return ref;
}
