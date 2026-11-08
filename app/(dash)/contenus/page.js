import Link from "next/link";
import { getAllContent, readFilters, filterContent } from "@/lib/data/content";
import { CONTENT_TYPES } from "@/lib/platform/videoConfig";
import { ALL_GRADES } from "@/lib/platform/liveGrades";
import { ALL_SUBJECTS } from "@/lib/platform/liveSubjects";
import { getGradeEmoji } from "@/lib/platform/videoDisplay";
import { formatNumber } from "@/lib/ui";
import CatalogFilters from "@/components/CatalogFilters";
import AdminContentCard from "@/components/AdminContentCard";
import StatCard from "@/components/StatCard";

const BATCH = 40; // like the platform: "Voir plus" loads 40 more

function countLabel(n, type) {
  if (type === CONTENT_TYPES.VIDEO) return `${n} vidéo${n > 1 ? "s" : ""}`;
  if (type === CONTENT_TYPES.PDF) return `${n} PDF`;
  return `${n} contenu${n > 1 ? "s" : ""}`;
}

export default async function ContenusPage({ searchParams }) {
  const sp = await searchParams;
  const f = readFilters(sp);
  const all = await getAllContent();
  const { items, counts } = filterContent(all, f);
  const shown = items.slice(0, f.limit);

  const live = all.filter((c) => c.status !== "deleted");
  const by = (s) => live.filter((c) => c.status === s).length;
  const grade = ALL_GRADES.find((g) => g.id === f.grade);
  const subject = ALL_SUBJECTS.find((s) => s.id === f.subject);
  const activeFilters = [f.q, f.section !== "all", f.subject !== "all", f.type !== "all", f.free, f.docCategory !== "all", f.status !== "all"].filter(Boolean).length;

  const moreHref = () => {
    const p = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => typeof v === "string" && p.set(k, v));
    p.set("n", String(f.limit + BATCH));
    return `/contenus?${p.toString()}`;
  };

  return (
    <div className="adm-catalog">
      <div className="ens-board" style={{ paddingBottom: "1.5rem" }}>
        <div className="ens-board-header">
          <div>
            <h1 className="ens-board-title">📚 Contenus</h1>
            <p className="ens-board-sub">Toutes les vidéos et tous les PDF des enseignants, quel que soit leur statut.</p>
          </div>
          {by("pending") > 0 && (
            <div className="ens-header-actions">
              <Link href="/contenus?statut=pending&tri=recentes" className="ens-new-video-btn">
                ⏳ {by("pending")} à valider
              </Link>
            </div>
          )}
        </div>

        <section className="ens-stats-grid adm-stats-4">
          <StatCard tone="sun" label="⏳ En validation" value={formatNumber(by("pending"))} hint="En attente de votre décision" />
          <StatCard tone="mint" label="✅ Publiés" value={formatNumber(by("published"))} hint={`${formatNumber(live.filter((c) => c.status === "published" && c.isOpen).length)} gratuits`} />
          <StatCard tone="sky" label="⚙️ Envoi / traitement" value={formatNumber(by("uploading") + by("encoding"))} hint={`${by("uploading")} en envoi · ${by("encoding")} en traitement`} />
          <StatCard
            label="📦 Total"
            value={formatNumber(live.length)}
            hint={`${formatNumber(live.filter((c) => c.type === CONTENT_TYPES.VIDEO).length)} vidéos · ${formatNumber(live.filter((c) => c.type === CONTENT_TYPES.PDF).length)} PDF`}
          />
        </section>
      </div>

      <CatalogFilters filters={f} counts={counts} />

      <div className="vid-container vid-body">
        <div className="vid-results-head">
          <h2 className="vid-results-title">
            {f.q ? (
              <>🔎 « {f.q} »</>
            ) : (
              <>
                {grade ? `${getGradeEmoji(grade.id)} ${grade.name}` : "Tous les niveaux"}
                {subject && <span className="vid-results-accent"> · {subject.name}</span>}
                {f.free && <span className="vid-results-accent"> · Gratuits</span>}
              </>
            )}
          </h2>
          <div className="vid-results-meta">
            <span>{countLabel(items.length, f.type)}</span>
            {activeFilters > 0 && (
              <Link href={f.grade !== "all" ? `/contenus?niveau=${f.grade}` : "/contenus"} className="vid-link-btn">
                Effacer les filtres
              </Link>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="vid-empty">
            <p className="vid-empty-emoji">🔎</p>
            <p className="vid-empty-title">Aucun document ne correspond à ces filtres.</p>
          </div>
        ) : (
          <>
            <div className="vid-grid">
              {shown.map((item) => (
                <AdminContentCard key={item.id} item={item} showGrade={f.grade === "all"} />
              ))}
            </div>
            {shown.length < items.length && (
              <div className="vid-more">
                <Link href={moreHref()} scroll={false} className="vid-btn-secondary">
                  Voir plus
                </Link>
                <p className="vid-more-count">
                  {shown.length} sur {items.length}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

