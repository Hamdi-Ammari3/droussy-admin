"use client";

// Copied from the platform (app/components/DocumentsCatalog.js → ChipRow / Chip).
import { useCallback, useEffect, useRef, useState } from "react";

export function ChipRow({ label, children, className = "" }) {
  const rowRef = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft < max - 2 });
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    el.addEventListener("scroll", update, { passive: true });
    function onWheel(e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max)) return;
      e.preventDefault();
      el.scrollLeft = Math.max(0, Math.min(max, el.scrollLeft + e.deltaY));
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
      el.removeEventListener("wheel", onWheel);
    };
  }, [update, children]);

  const scrollBy = (dir) => rowRef.current?.scrollBy({ left: dir * Math.max(200, rowRef.current.clientWidth * 0.7), behavior: "smooth" });

  return (
    <div className={`vid-chip-scroller ${edges.left ? "vid-chip-scroller-left" : ""} ${edges.right ? "vid-chip-scroller-right" : ""} ${className}`}>
      {edges.left && (
        <button type="button" className="vid-chip-arrow vid-chip-arrow-left" onClick={() => scrollBy(-1)} aria-label="Défiler à gauche">
          ‹
        </button>
      )}
      <div ref={rowRef} className="vid-chip-row" aria-label={label}>
        {children}
      </div>
      {edges.right && (
        <button type="button" className="vid-chip-arrow vid-chip-arrow-right" onClick={() => scrollBy(1)} aria-label="Défiler à droite">
          ›
        </button>
      )}
    </div>
  );
}

export function Chip({ active, onClick, children, small }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`vid-chip ${small ? "vid-chip-sm" : ""} ${active ? "vid-chip-active" : ""}`}>
      {children}
    </button>
  );
}
