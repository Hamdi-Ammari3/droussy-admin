import Link from "next/link";

export const PAGE_SIZE = 50;

export default function Pager({ total, page, searchParams, basePath }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p) => {
    const next = new URLSearchParams();
    Object.entries(searchParams || {}).forEach(([k, v]) => typeof v === "string" && next.set(k, v));
    next.set("page", String(p));
    return `${basePath}?${next.toString()}`;
  };
  return (
    <div className="adm-table-foot">
      <span>
        {total} résultat{total > 1 ? "s" : ""}
        {pages > 1 ? ` · page ${page} / ${pages}` : ""}
      </span>
      {pages > 1 && (
        <span style={{ display: "flex", gap: "0.5rem" }}>
          {page > 1 && <Link className="adm-btn" href={href(page - 1)}>← Précédent</Link>}
          {page < pages && <Link className="adm-btn" href={href(page + 1)}>Suivant →</Link>}
        </span>
      )}
    </div>
  );
}
