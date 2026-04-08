import { useEffect, useRef } from "react";

/**
 * Effet parallax simple sur un élément de fond.
 * @param {number} speed — 0 = fixe, 0.5 = demi-vitesse (default 0.4)
 */
export function useParallax(speed = 0.4) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onScroll() {
      const rect   = el.getBoundingClientRect();
      const offset = window.scrollY;
      el.style.transform = `translateY(${offset * speed}px)`;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  return ref;
}
