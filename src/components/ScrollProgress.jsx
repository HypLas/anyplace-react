import { useEffect, useState } from "react";

export default function ScrollProgress({ top = 0 }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    function onScroll() {
      const doc     = document.documentElement;
      const scrolled = doc.scrollTop || document.body.scrollTop;
      const total    = doc.scrollHeight - doc.clientHeight;
      setPct(total > 0 ? (scrolled / total) * 100 : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="scroll-progress"
      style={{ width: `${pct}%`, top }}
    />
  );
}
