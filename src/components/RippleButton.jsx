import { useRef } from "react";

/**
 * Bouton avec effet ripple au clic.
 */
export default function RippleButton({ children, onClick, className = "", style = {}, disabled = false, as: Tag = "button" }) {
  const btnRef = useRef(null);

  function handleClick(e) {
    const btn  = btnRef.current;
    if (!btn) return;

    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height);
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;

    const wave = document.createElement("span");
    wave.className = "ripple-wave";
    wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(wave);
    setTimeout(() => wave.remove(), 600);

    onClick?.(e);
  }

  return (
    <Tag
      ref={btnRef}
      className={`ripple-btn ${className}`}
      style={style}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </Tag>
  );
}
