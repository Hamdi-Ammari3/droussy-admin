import { getStudents } from "@/lib/data/users";
import { normalizeText } from "@/lib/platform/videoText";
import { formatDate, formatNumber, daysLeft } from "@/lib/ui";
import StatCard from "@/components/StatCard";
import TableFilters from "@/components/TableFilters";
import AddAccountButton from "@/components/AddAccountButton";
import Pager, { PAGE_SIZE } from "@/components/Pager";

const EXPIRING_DAYS = 30;

// Same states as lib/subscription.js → subscriptionStatus(), plus "expire bientôt".
function badge(s) {
  const d = daysLeft(s.sub.endsAt);
  if (s.sub.state === "active" && s.sub.legacy) return { id: "active", cls: "ens-video-chip ens-video-chip-ok", label: "✅ Actif (ancien achat)" };
  if (s.sub.state === "active" && d != null && d <= EXPIRING_DAYS) return { id: "expiring", cls: "ens-video-chip adm-chip-warn", label: `⏰ Expire dans ${d} j` };
  if (s.sub.state === "active") return { id: "active", cls: "ens-video-chip ens-video-chip-ok", label: "✅ Actif" };
  if (s.sub.state === "expired") return { id: "expired", cls: "ens-video-chip ens-video-chip-pdf", label: "⌛ Expiré" };
  if (s.sub.state === "inactive") return { id: "inactive", cls: "ens-video-chip ens-video-chip-muted", label: "⏸️ Suspendu" };
  return { id: "none", cls: "ens-video-chip ens-video-chip-muted", label: "Sans abonnement" };
}

const isSubscribed = (b) => b.id === "active" || b.id === "expiring";

export default async function ElevesPage({ searchParams }) {
  const sp = await searchParams;
  const students = (await getStudents()).map((s) => ({ ...s, badge: badge(s) }));

  const subscribed = students.filter((s) => isSubscribed(s.badge));
  const avgOpened = subscribed.length ? subscribed.reduce((t, s) => t + s.sub.used, 0) / subscribed.length : 0;
  const expiring = students.filter((s) => s.badge.id === "expiring").length;
  const ended = students.filter((s) => s.badge.id === "expired" || s.badge.id === "inactive").length;

  // ---- filters (?q=&statut=&tri=) ----
  const q = normalizeText(String(sp.q || "").trim());
  const statut = String(sp.statut || "all");
  let rows = students.filter((s) => {
    if (statut === "abonnes" && !isSubscribed(s.badge)) return false;
    if (statut === "expiring" && s.badge.id !== "expiring") return false;
    if (statut === "ended" && !["expired", "inactive"].includes(s.badge.id)) return false;
    if (statut === "none" && s.badge.id !== "none") return false;
    if (q && !normalizeText(`${s.name} ${s.phone}`).includes(q)) return false;
    return true;
  });
  const sorts = {
    recent: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
    used: (a, b) => b.sub.used - a.sub.used,
    end: (a, b) => (a.sub.endsAt ?? Infinity) - (b.sub.endsAt ?? Infinity),
    name: (a, b) => a.name.localeCompare(b.name, "fr"),
  };
  rows.sort(sorts[sp.tri] || sorts.recent);
  const page = Math.max(1, Number(sp.page) || 1);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="ens-board">
      <div className="ens-board-header">
        <div>
          <h1 className="ens-board-title">🎓 Élèves</h1>
          <p className="ens-board-sub">Abonnements et documents ouverts par chaque élève.</p>
        </div>
        <div className="ens-header-actions">
          <AddAccountButton role="student" />
        </div>
      </div>

      <section className="ens-stats-grid adm-stats-4">
        <StatCard tone="mint" label="✅ Élèves abonnés" value={formatNumber(subscribed.length)} hint={`${formatNumber(students.length)} comptes élèves au total`} />
        <StatCard tone="sun" label="📖 Moyenne de documents ouverts" value={formatNumber(avgOpened)} hint="par élève abonné, sur l'abonnement en cours" />
        <StatCard tone="coral" label="⏰ Expirent sous 30 jours" value={formatNumber(expiring)} hint="à relancer pour le renouvellement" />
        <StatCard label="⌛ Expirés / suspendus" value={formatNumber(ended)} />
      </section>

      <div className="adm-panel">
        <TableFilters
          placeholder="Nom ou téléphone…"
          selects={[
            {
              name: "statut",
              options: [
                { id: "all", label: "Tous les élèves" },
                { id: "abonnes", label: "✅ Abonnés" },
                { id: "expiring", label: "⏰ Expirent bientôt" },
                { id: "ended", label: "⌛ Expirés / suspendus" },
                { id: "none", label: "Sans abonnement" },
              ],
            },
            {
              name: "tri",
              options: [
                { id: "recent", label: "🆕 Plus récents" },
                { id: "used", label: "📖 Plus de documents ouverts" },
                { id: "end", label: "⏰ Fin d'abonnement proche" },
                { id: "name", label: "🔤 Nom" },
              ],
            },
          ]}
        />
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Inscrit le</th>
                <th>Abonnement</th>
                <th>Fin d&apos;abonnement</th>
                <th className="adm-num">Documents ouverts</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr className="adm-empty-row"><td colSpan={5}>Aucun élève trouvé.</td></tr>
              ) : (
                pageRows.map((s) => {
                  const pct = s.sub.quota ? Math.min(100, (s.sub.used / s.sub.quota) * 100) : 0;
                  return (
                    <tr key={s.id}>
                      <td>
                        <span className="adm-name">{s.name}</span>
                        <span className="adm-sub adm-mono">{s.phone}</span>
                      </td>
                      <td>{formatDate(s.createdAt)}</td>
                      <td><span className={s.badge.cls}>{s.badge.label}</span></td>
                      <td>
                        {formatDate(s.sub.endsAt)}
                        {s.sub.startedAt ? <span className="adm-sub">depuis le {formatDate(s.sub.startedAt)}</span> : null}
                      </td>
                      <td className="adm-num">
                        {formatNumber(s.sub.used)}
                        {s.sub.quota ? <span className="adm-sub">sur {formatNumber(s.sub.quota)}</span> : null}
                        {s.sub.quota ? <div className="adm-meter"><i style={{ width: `${pct}%` }} /></div> : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pager total={rows.length} page={page} searchParams={sp} basePath="/eleves" />
      </div>
    </div>
  );
}
