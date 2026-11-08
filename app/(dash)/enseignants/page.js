import Link from "next/link";
import { getTeachers } from "@/lib/data/users";
import { getAllContent } from "@/lib/data/content";
import { normalizeText } from "@/lib/platform/videoText";
import { PAYOUT_THRESHOLD_DT, CONTENT_TYPES } from "@/lib/platform/videoConfig";
import { formatDate, formatNumber, formatMoney } from "@/lib/ui";
import StatCard from "@/components/StatCard";
import TableFilters from "@/components/TableFilters";
import AddAccountButton from "@/components/AddAccountButton";
import Pager, { PAGE_SIZE } from "@/components/Pager";

export default async function EnseignantsPage({ searchParams }) {
  const sp = await searchParams;
  const [teachers, content] = await Promise.all([getTeachers(), getAllContent()]);

  // Per-teacher document counts from the `videos` collection.
  const stats = new Map();
  for (const c of content) {
    if (!c.teacherId || c.status === "deleted") continue;
    const s = stats.get(c.teacherId) || { published: 0, pending: 0, videos: 0, pdfs: 0, total: 0 };
    s.total++;
    if (c.status === "published") {
      s.published++;
      if (c.type === CONTENT_TYPES.PDF) s.pdfs++;
      else s.videos++;
    }
    if (c.status === "pending") s.pending++;
    stats.set(c.teacherId, s);
  }
  const all = teachers.map((t) => ({ ...t, ...(stats.get(t.id) || { published: 0, pending: 0, videos: 0, pdfs: 0, total: 0 }) }));

  // ---- filters (?q=&filtre=&tri=) ----
  const q = normalizeText(String(sp.q || "").trim());
  const filtre = String(sp.filtre || "all");
  let rows = all.filter((t) => {
    if (filtre === "payout" && t.balanceDT < PAYOUT_THRESHOLD_DT) return false;
    if (filtre === "pending" && t.pending === 0) return false;
    if (filtre === "active" && t.published === 0) return false;
    if (filtre === "none" && t.total > 0) return false;
    if (q && !normalizeText(`${t.name} ${t.phone}`).includes(q)) return false;
    return true;
  });
  const sorts = {
    views: (a, b) => b.viewsTotal - a.viewsTotal,
    content: (a, b) => b.published - a.published,
    balance: (a, b) => b.balanceDT - a.balanceDT,
    recent: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
  };
  rows.sort(sorts[sp.tri] || sorts.views);
  const page = Math.max(1, Number(sp.page) || 1);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalBalance = all.reduce((t, x) => t + x.balanceDT, 0);
  const payoutDue = all.filter((t) => t.balanceDT >= PAYOUT_THRESHOLD_DT).length;

  return (
    <div className="ens-board">
      <div className="ens-board-header">
        <div>
          <h1 className="ens-board-title">🏫 Enseignants</h1>
          <p className="ens-board-sub">Documents publiés, vues et soldes à verser.</p>
        </div>
        <div className="ens-header-actions">
          <AddAccountButton role="teacher" />
        </div>
      </div>

      <section className="ens-stats-grid adm-stats-4">
        <StatCard label="🏫 Enseignants" value={formatNumber(all.length)} hint={`${all.filter((t) => t.published > 0).length} avec au moins 1 document publié`} />
        <StatCard tone="sky" label="📚 Documents publiés" value={formatNumber(all.reduce((t, x) => t + x.published, 0))} hint={`${formatNumber(all.reduce((t, x) => t + x.pending, 0))} en validation`} />
        <StatCard tone="sun" label="👁 Vues totales" value={formatNumber(all.reduce((t, x) => t + x.viewsTotal, 0))} hint="vues qualifiées payées" />
        <StatCard tone="mint" label="💰 Soldes à verser" value={`${formatMoney(totalBalance)} DT`} hint={`${payoutDue} enseignant${payoutDue > 1 ? "s" : ""} ≥ ${PAYOUT_THRESHOLD_DT} DT`} />
      </section>

      <div className="adm-panel">
        <TableFilters
          placeholder="Nom ou téléphone…"
          selects={[
            {
              name: "filtre",
              options: [
                { id: "all", label: "Tous les enseignants" },
                { id: "payout", label: `💰 Paiement dû (≥ ${PAYOUT_THRESHOLD_DT} DT)` },
                { id: "pending", label: "⏳ Documents en validation" },
                { id: "active", label: "✅ Au moins 1 publié" },
                { id: "none", label: "Aucun document" },
              ],
            },
            {
              name: "tri",
              options: [
                { id: "views", label: "👁 Plus de vues" },
                { id: "content", label: "📚 Plus de documents" },
                { id: "balance", label: "💰 Solde le plus élevé" },
                { id: "recent", label: "🆕 Plus récents" },
              ],
            },
          ]}
        />
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Enseignant</th>
                <th className="adm-num">Publiés</th>
                <th className="adm-num">En validation</th>
                <th className="adm-num">Vues</th>
                <th className="adm-num">Solde</th>
                <th>Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr className="adm-empty-row"><td colSpan={6}>Aucun enseignant trouvé.</td></tr>
              ) : (
                pageRows.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link className="adm-link" href={`/enseignants/${t.id}`}>{t.name}</Link>
                      <span className="adm-sub adm-mono">{t.phone}</span>
                    </td>
                    <td className="adm-num">
                      {t.published}
                      <span className="adm-sub">🎬 {t.videos} · 📄 {t.pdfs}</span>
                    </td>
                    <td className="adm-num">
                      {t.pending ? (
                        <Link href={`/contenus?statut=pending&q=${encodeURIComponent(t.name)}`} className="ens-video-chip adm-chip-warn" style={{ textDecoration: "none" }}>
                          {t.pending}
                        </Link>
                      ) : (
                        0
                      )}
                    </td>
                    <td className="adm-num">{formatNumber(t.viewsTotal)}</td>
                    <td className="adm-num">
                      {t.balanceDT >= PAYOUT_THRESHOLD_DT ? (
                        <span className="ens-video-chip ens-video-chip-ok">{formatMoney(t.balanceDT)} DT</span>
                      ) : (
                        `${formatMoney(t.balanceDT)} DT`
                      )}
                    </td>
                    <td>{formatDate(t.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pager total={rows.length} page={page} searchParams={sp} basePath="/enseignants" />
      </div>
    </div>
  );
}
