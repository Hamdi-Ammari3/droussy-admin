"use client";

// Same filter bar as the platform home page (DocumentsCatalog.js): search,
// niveau, matière, Tout / Vidéos / PDF, Tous / Gratuits, section and PDF-type
// chips — plus the old 🔥 Populaires / 🆕 Récents sort and an admin status row.
// Filters live in the URL with the platform's names (?niveau=&matiere=&type=…).

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GRADE_GROUPS, GRADES_WITH_SPECIALIZATION, SPECIALIZATIONS } from "@/lib/platform/liveGrades";
import { ALL_SUBJECTS, getSubjectsForGrade } from "@/lib/platform/liveSubjects";
import { CONTENT_TYPES, PDF_CATEGORIES } from "@/lib/platform/videoConfig";
import { getGradeEmoji, getSubjectEmoji } from "@/lib/platform/videoDisplay";
import { ADMIN_STATUSES } from "@/lib/ui";
import { ChipRow, Chip } from "./ChipRow";

const TYPE_FILTERS = [
  { id: "all", label: "Tout" },
  { id: CONTENT_TYPES.VIDEO, label: "🎬 Vidéos" },
  { id: CONTENT_TYPES.PDF, label: "📄 PDF" },
];

export default function CatalogFilters({ filters: f, counts }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(f.q);
  useEffect(() => setSearchInput(f.q), [f.q]);

  // name → value ("" / "all" / false removes it). Any filter change goes back to the first 40.
  function set(changes) {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([k, v]) => {
      if (v === "" || v === "all" || v === false || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    next.delete("n");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function submitSearch(e) {
    e.preventDefault();
    const q = searchInput.trim().replace(/\s+/g, " ").slice(0, 80);
    setSearchInput(q);
    set({ q });
    if (typeof document !== "undefined") document.activeElement?.blur?.();
  }

  const hasSections = f.grade !== "all" && GRADES_WITH_SPECIALIZATION.has(f.grade);
  const subjects = (f.grade === "all" ? ALL_SUBJECTS : getSubjectsForGrade(f.grade)).filter(
    (s) => s.id === f.subject || (counts.subject[s.id] || 0) > 0
  );
  const gradeGroups = GRADE_GROUPS.map((g) => ({
    ...g,
    grades: g.grades.filter((gr) => gr.id === f.grade || (counts.grade[gr.id] || 0) > 0),
  })).filter((g) => g.grades.length);
  const typeCount = (id) =>
    id === "all" ? (counts.type.video || 0) + (counts.type.pdf || 0) : counts.type[id] || 0;
  const docChips = PDF_CATEGORIES.filter((c) => (counts.doc[c.id] || 0) > 0);
  const statusTotal = Object.entries(counts.status).reduce((a, [k, n]) => (k === "deleted" ? a : a + n), 0);

  return (
    <div className="vid-filterbar cat-filterbar" style={{ opacity: pending ? 0.75 : 1, transition: "opacity .15s" }}>
      <div className="vid-container vid-filterbar-inner">
        <form className="cat-search" role="search" onSubmit={submitSearch}>
          <span className="cat-search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            maxLength={80}
            placeholder="Titre, matière, enseignant ou ID…"
            aria-label="Chercher un document"
            className="cat-search-input"
          />
          {searchInput && (
            <button
              type="button"
              className="cat-search-clear"
              onClick={() => {
                setSearchInput("");
                set({ q: "" });
              }}
              aria-label="Effacer la recherche"
            >
              ✕
            </button>
          )}
          <button type="submit" className="cat-search-btn" aria-label="Rechercher">
            <span className="cat-search-btn-label">Rechercher</span>
            <span className="cat-search-btn-icon" aria-hidden="true">→</span>
          </button>
        </form>

        <div className="cat-filter-row">
          <select
            value={f.grade}
            onChange={(e) => set({ niveau: e.target.value, matiere: "", section: "" })}
            aria-label="Niveau"
            className="vid-select cat-select cat-select-grade"
          >
            <option value="all">🎒 Tous les niveaux</option>
            {gradeGroups.map((group) => (
              <optgroup key={group.levelName} label={group.levelName}>
                {group.grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {getGradeEmoji(g.id)} {g.name} ({counts.grade[g.id] || 0})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <select
            value={f.subject}
            onChange={(e) => set({ matiere: e.target.value })}
            aria-label="Matière"
            className={`vid-select cat-select ${f.subject !== "all" ? "cat-select-active" : ""}`}
          >
            <option value="all">✨ Toutes les matières</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {getSubjectEmoji(s.id, s.emoji)} {s.name} ({counts.subject[s.id] || 0})
              </option>
            ))}
          </select>

          <div className="vid-type-toggle cat-type-toggle" role="radiogroup" aria-label="Type de document">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={f.type === t.id}
                onClick={() => set({ type: t.id, doc: "" })}
                className={`vid-type-option ${f.type === t.id ? "vid-type-option-active" : ""}`}
              >
                {t.label}
                <span className="vid-type-count">{typeCount(t.id)}</span>
              </button>
            ))}
          </div>

          <div className="cat-access" role="radiogroup" aria-label="Accès aux documents">
            {[
              { id: false, label: "Tous les documents" },
              { id: true, label: "Gratuits" },
            ].map((a) => (
              <button
                key={String(a.id)}
                type="button"
                role="radio"
                aria-checked={f.free === a.id}
                onClick={() => set({ gratuit: a.id ? "1" : "" })}
                className={`cat-access-option ${f.free === a.id ? "cat-access-option-active" : ""}`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* The sort that used to be on the platform home page */}
          <select
            value={f.sort}
            onChange={(e) => set({ tri: e.target.value === "recentes" ? "recentes" : "" })}
            aria-label="Trier"
            className="vid-select vid-select-sort"
          >
            <option value="populaires">🔥 Populaires</option>
            <option value="recentes">🆕 Récents</option>
          </select>
        </div>

        {/* Admin only: every status, not just "published" */}
        <ChipRow label="Filtrer par statut" className="adm-status-row">
          <span className="vid-chip-label">Statut :</span>
          <Chip small active={f.status === "all"} onClick={() => set({ statut: "" })}>
            Tous <span className="vid-chip-count">{statusTotal}</span>
          </Chip>
          {ADMIN_STATUSES.filter((s) => s.id !== "deleted" || f.status === "deleted" || counts.status.deleted).map((s) => (
            <Chip small key={s.id} active={f.status === s.id} onClick={() => set({ statut: s.id })}>
              {s.label}
              <span className="vid-chip-count">{counts.status[s.id] || 0}</span>
            </Chip>
          ))}
        </ChipRow>

        {hasSections && SPECIALIZATIONS.some((sp) => (counts.section[sp.id] || 0) > 0) && (
          <ChipRow label="Filtrer par section">
            <span className="vid-chip-label">Section :</span>
            <Chip small active={f.section === "all"} onClick={() => set({ section: "" })}>
              Toutes
            </Chip>
            {SPECIALIZATIONS.filter((sp) => (counts.section[sp.id] || 0) > 0).map((s) => (
              <Chip small key={s.id} active={f.section === s.id} onClick={() => set({ section: s.id })}>
                {s.name}
                <span className="vid-chip-count">{counts.section[s.id]}</span>
              </Chip>
            ))}
          </ChipRow>
        )}

        {f.type === CONTENT_TYPES.PDF && docChips.length > 1 && (
          <ChipRow label="Filtrer par type de PDF">
            <span className="vid-chip-label">Type :</span>
            <Chip small active={f.docCategory === "all"} onClick={() => set({ doc: "" })}>
              Tous
            </Chip>
            {docChips.map((c) => (
              <Chip small key={c.id} active={f.docCategory === c.id} onClick={() => set({ doc: c.id })}>
                {c.emoji} {c.label}
                <span className="vid-chip-count">{counts.doc[c.id]}</span>
              </Chip>
            ))}
          </ChipRow>
        )}
      </div>
    </div>
  );
}
