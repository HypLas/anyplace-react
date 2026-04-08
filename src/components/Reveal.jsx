import { useEffect, useRef } from "react";

/**
 * Wrapper qui anime ses enfants quand ils entrent dans le viewport.
 * direction : "up" | "left" | "right"
 * delay     : délai CSS ex "0.1s"
 */
export default function Reveal({ children, direction = "up", delay = "0s", className = "", as: Tag = "div" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cls = direction === "left" ? "reveal-left" : direction === "right" ? "reveal-right" : "reveal";
    el.classList.add(cls);
    el.style.transitionDelay = delay;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [direction, delay]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
