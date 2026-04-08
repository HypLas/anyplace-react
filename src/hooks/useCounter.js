import { useEffect, useRef, useState } from "react";

/**
 * Anime un nombre de 0 à `target` quand il entre dans le viewport.
 */
export function useCounter(target, duration = 1400) {
  const [count, setCount]   = useState(0);
  const inView              = useRef(false);
  const containerRef        = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !inView.current) {
        inView.current = true;
        const start     = performance.now();
        const num       = parseFloat(target);

        function step(now) {
          const elapsed = now - start;
          const progress= Math.min(elapsed / duration, 1);
          // Ease out cubic
          const ease    = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * num));
          if (progress < 1) requestAnimationFrame(step);
          else setCount(num);
        }
        requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return [containerRef, count];
}
