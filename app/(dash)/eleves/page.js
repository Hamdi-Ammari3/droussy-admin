import { getStudents } from "@/lib/data/users";
import { normalizeText } from "@/lib/platform/videoText";
import { TRIAL_DAYS, TRIAL_QUOTA } from "@/lib/platform/subscription";
import { formatDate, formatNumber, daysLeft } from "@/lib/ui";
import StatCard from "@/components/StatCard";
import TableFilters from "@/components/TableFilters";
import AddAccountButton from "@/components/AddAccountButton";
import StudentActions from "@/components/StudentActions";
import Pager, { PAGE_SIZE } from "@/components/Pager";

const EXPIRING_DAYS = 30;
const TRIAL_ENDING_DAYS = 2;

// Same states as lib/subscription.js → subscriptionStatus(), plus trial and "expire bientôt".
function badge(s) {
  const d = daysLeft(s.sub.endsAt);
  if (s.sub.trial) {
    const over = s.sub.state !== "active" || s.sub.used >= s.sub.quota;
    if (s.sub.state === "inactive") return { id: "inactive", cls: "ens-video-chip ens-video-chip-muted", label: "⏸️ Suspendu" };
    if (over) return { id: "trial_ended", cls: "ens-video-chip adm-chip-trial-end", label: "🎓 Essai terminé" };
    return {
      id: "trial",
      ending: d != null && d <= TRIAL_ENDING_DAYS,
      cls: `ens-video-chip ${d != null && d <= TRIAL_ENDING_DAYS ? "adm-chip-warn" : "adm-chip-trial"}`,
      label: `🧪 Essai · ${d <= 0 ? "dernier jour" : `${d} j`}`,
    };
  }
  if (s.sub.state === "active" && s.sub.legacy) return { id: "active", cls: "ens-video-chip ens-video-chip-ok", label: "✅ Actif (ancien achat)" };
  if (s.sub.state === "active" && d != null && d <= EXPIRING_DAYS) return { id: "expiring", cls: "ens-video-chip adm-chip-warn", label: `⏰ Expire dans ${d} j` };
  if (s.sub.state === "active") return { id: "active", cls: "ens-video-chip ens-video-chip-ok", label: "✅ Actif" };
  if (s.sub.state === "expired") return { id: "expired", cls: "ens-video-chip ens-video-chip-pdf", label: "⌛ Expiré" };
  if (s.sub.state === "inactive") return { id: "inactive", cls: "ens-video-chip ens-video-chip-muted", label: "⏸️ Suspendu" };
  return { id: "none", cls: "ens-video-chip ens-video-chip-muted", label: "Sans abonnement" };
}

const isPaid = (b) => b.id === "active" || b.id === "expiring";

export default async function ElevesPage({ searchParams }) {
  const sp = await searchParams;
  const students = (await getStudents()).map((s) => ({ ...s, badge: badge(s) }));

  const paid = students.filter((s) => isPaid(s.badge));
  const onTrial = students.filter((s) => s.badge.id === "trial");
  const trialEnding = onTrial.filter((s) => s.badge.ending).length;
  const trialsGiven = students.filter((s) => s.trialUsedAt).length;
  const converted = students.filter((s) => s.convertedFromTrialAt).length;
  const trialsFinished = trialsGiven - onTrial.length; // trials that can no longer be "in progress"
  const conversion = trialsFinished > 0 ? Math.round((converted / trialsFinished) * 100) : null;
  const avgOpened = paid.length ? paid.reduce((t, s) => t + s.sub.used, 0) / paid.length : 0;
  const expiring = students.filter((s) => s.badge.id === "expiring").length;

  // ---- filters (?q=&statut=&tri=) ----
  const q = normalizeText(String(sp.q || "").trim());
  const statut = String(sp.statut || "all");
  const keep = {
    all: () => true,
    abonnes: (s) => isPaid(s.badge),
    trial: (s) => s.badge.id === "trial",
    trial_ending: (s) => s.badge.id === "trial" && s.badge.ending,
    trial_ended: (s) => s.badge.id === "trial_ended",
    converted: (s) => !!s.convertedFromTrialAt,
    expiring: (s) => s.badge.id === "expiring",
    ended: (s) => ["expired", "inactive"].includes(s.badge.id),
    none: (s) => s.badge.id === "none",
  }[statut] || (() => true);
  let rows = students.filter((s) => keep(s) && (!q || normalizeText(`${s.name} ${s.phone}`).includes(q)));
  const sorts = {
    recent: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
    used: (a, b) => b.sub.used - a.sub.used,
    end: (a, b) => (a.sub.endsAt ?? Infinity) - (b.sub.endsAt ?? Infinity),
    name: (a, b) => a.name.localeCompare(b.name, "fr"),
  };
  rows.sort(sorts[sp.tri] || (statut.startsWith("trial") ? sorts.end : sorts.recent));
  const page = Math.max(1, Number(sp.page) || 1);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="ens-board">
      <div className="ens-board-header">
        <div>
          <h1 className="ens-board-title">🎓 Élèves</h1>
          <p className="ens-board-sub">Abonnements, essais gratuits et documents ouverts par chaque élève.</p>
        </div>
        <div className="ens-header-actions">
          <AddAccountButton role="student" />
        </div>
      </div>

      <section className="ens-stats-grid adm-stats-4">
        <StatCard
          tone="mint"
          label="✅ Abonnés payants"
          value={formatNumber(paid.length)}
          hint={`${formatNumber(students.length)} comptes · ${expiring} expirent sous 30 j`}
        />
        <StatCard
          tone="sky"
          label="🧪 En essai gratuit"
          value={formatNumber(onTrial.length)}
          hint={trialEnding ? `⏳ ${trialEnding} se termine${trialEnding > 1 ? "nt" : ""} sous 48 h, à relancer` : `${TRIAL_DAYS} jours · ${TRIAL_QUOTA} documents`}
        />
        <StatCard
          tone="sun"
          label="📈 Essais convertis"
          value={conversion === null ? "—" : `${conversion} %`}
          hint={`${converted} payant${converted > 1 ? "s" : ""} sur ${trialsFinished} essai${trialsFinished > 1 ? "s" : ""} terminé${trialsFinished > 1 ? "s" : ""}`}
        />
        <StatCard label="📖 Moyenne de documents ouverts" value={formatNumber(avgOpened)} hint="par abonné payant, sur l'abonnement en cours" />
      </section>

      <div className="adm-panel">
        <TableFilters
          placeholder="Nom ou téléphone…"
          selects={[
            {
              name: "statut",
              options: [
                { id: "all", label: "Tous les élèves" },
                { id: "abonnes", label: "✅ Abonnés payants" },
                { id: "trial", label: "🧪 En essai" },
                { id: "trial_ending", label: "⏳ Essai finit sous 48 h" },
                { id: "trial_ended", label: "🎓 Essai terminé (non converti)" },
                { id: "converted", label: "📈 Convertis (essai → payé)" },
                { id: "expiring", label: "⏰ Abonnement expire bientôt" },
                { id: "ended", label: "⌛ Expirés / suspendus" },
                { id: "none", label: "Sans abonnement" },
              ],
            },
            {
              name: "tri",
              options: [
                { id: "recent", label: "🆕 Plus récents" },
                { id: "used", label: "📖 Plus de documents ouverts" },
                { id: "end", label: "⏰ Fin proche" },
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
                <th>Formule</th>
                <th>Fin</th>
                <th className="adm-num">Documents ouverts</th>
                <th className="adm-num">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr className="adm-empty-row"><td colSpan={6}>Aucun élève trouvé.</td></tr>
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
                      <td>
                        <span className={s.badge.cls}>{s.badge.label}</span>
                        {s.convertedFromTrialAt && <span className="adm-sub">📈 Converti le {formatDate(s.convertedFromTrialAt)}</span>}
                      </td>
                      <td>
                        {formatDate(s.sub.endsAt)}
                        {s.sub.startedAt ? <span className="adm-sub">depuis le {formatDate(s.sub.startedAt)}</span> : null}
                      </td>
                      <td className="adm-num">
                        {formatNumber(s.sub.used)}
                        {s.sub.quota ? <span className="adm-sub">sur {formatNumber(s.sub.quota)}</span> : null}
                        {s.sub.quota ? <div className="adm-meter"><i style={{ width: `${pct}%` }} /></div> : null}
                      </td>
                      <td className="adm-num">
                        <StudentActions student={s} />
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
