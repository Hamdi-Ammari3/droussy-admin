"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Search box + selects for the students / teachers tables, kept in the URL.
// selects: [{ name, options: [{ id, label }] }] — the first option is the default.
export default function TableFilters({ placeholder, selects = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") || "");
  useEffect(() => setQ(params.get("q") || ""), [params]);

  function set(name, value, isDefault) {
    const next = new URLSearchParams(params.toString());
    if (!value || isDefault) next.delete(name);
    else next.set(name, value);
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  return (
    <div className="adm-panel-head" style={{ opacity: pending ? 0.75 : 1 }}>
      <form
        className="cat-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          set("q", q.trim());
        }}
      >
        <span className="cat-search-icon" aria-hidden="true">🔍</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="cat-search-input"
          aria-label={placeholder}
        />
        {q && (
          <button
            type="button"
            className="cat-search-clear"
            onClick={() => {
              setQ("");
              set("q", "");
            }}
            aria-label="Effacer"
          >
            ✕
          </button>
        )}
        <button type="submit" className="cat-search-btn" aria-label="Rechercher">
          <span className="cat-search-btn-label">Rechercher</span>
          <span className="cat-search-btn-icon" aria-hidden="true">→</span>
        </button>
      </form>
      {selects.map((s) => (
        <select
          key={s.name}
          className="vid-select cat-select"
          value={params.get(s.name) || s.options[0].id}
          onChange={(e) => set(s.name, e.target.value, e.target.value === s.options[0].id)}
          aria-label={s.name}
        >
          {s.options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
