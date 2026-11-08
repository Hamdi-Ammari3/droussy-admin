import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeacher } from "@/lib/data/users";
import { getAllContent } from "@/lib/data/content";
import { PAYOUT_THRESHOLD_DT } from "@/lib/platform/videoConfig";
import { formatDate, formatNumber, formatMoney, PLATFORM_URL } from "@/lib/ui";
import StatCard from "@/components/StatCard";
import RevealPin from "@/components/RevealPin";
import AdminContentCard from "@/components/AdminContentCard";

export default async function TeacherProfile({ params }) {
  const { id } = await params;
  const [t, content] = await Promise.all([getTeacher(id), getAllContent()]);
  if (!t) notFound();

  const docs = content
    .filter((c) => c.teacherId === t.id && c.status !== "deleted")
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const published = docs.filter((c) => c.status === "published");
  const pending = docs.filter((c) => c.status === "pending").length;
  const toPayout = Math.max(0, PAYOUT_THRESHOLD_DT - t.balanceDT);

  return (
    <div className="ens-board">
      <Link href="/enseignants" className="adm-back">← Enseignants</Link>
      <div className="ens-board-header">
        <div>
          <h1 className="ens-board-title">{t.sex === "woman" ? "👩‍🏫" : "👨‍🏫"} {t.name}</h1>
          <p className="ens-board-sub">Enseignant depuis le {formatDate(t.createdAt)}</p>
        </div>
        <div className="ens-header-actions">
          <a className="ens-new-video-btn" href={`https://wa.me/216${t.phone}`} target="_blank" rel="noopener noreferrer">
            💬 WhatsApp
          </a>
          <a className="ens-profile-btn" href={`${PLATFORM_URL}/enseignants/${t.id}`} target="_blank" rel="noopener noreferrer">
            👀 Profil public
          </a>
        </div>
      </div>

      {/* Same 3 cards as the teacher's own dashboard */}
      <section className="ens-stats-grid">
        <StatCard
          tone="mint"
          label="💰 Solde à recevoir"
          value={`${formatMoney(t.balanceDT)} DT`}
          hint={t.balanceDT >= PAYOUT_THRESHOLD_DT ? "✅ Paiement dû" : `Encore ${formatMoney(toPayout)} DT avant le paiement`}
        />
        <StatCard tone="sun" label="👁 Vues totales" value={formatNumber(t.viewsTotal)} hint={`Gagné au total : ${formatMoney(t.earnedDT)} DT`} />
        <StatCard label="📚 Contenus publiés" value={published.length} hint={`${docs.length} au total${pending ? ` · ${pending} en validation` : ""}`} />
      </section>

      <div className="adm-detail">
        <div className="adm-box">
          <h2 className="adm-box-title">Documents ({docs.length})</h2>
          {docs.length === 0 ? (
            <div className="vid-empty">
              <p className="vid-empty-emoji">📚</p>
              <p className="vid-empty-title">Aucun document pour l&apos;instant</p>
            </div>
          ) : (
            <div className="vid-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {docs.map((c) => (
                <AdminContentCard key={c.id} item={c} showTeacher={false} />
              ))}
            </div>
          )}
        </div>

        <div className="adm-box">
          <h2 className="adm-box-title">Compte</h2>
          <dl className="adm-kv">
            <dt>Nom</dt>
            <dd>{t.name}</dd>
            <dt>Téléphone</dt>
            <dd className="adm-mono">{t.phone}</dd>
            <dt>Code (PIN)</dt>
            <dd><RevealPin pin={String(t.password || "")} /></dd>
            <dt>Civilité</dt>
            <dd>{t.sex === "woman" ? "Mme" : "M."}</dd>
            <dt>Déjà versé</dt>
            <dd>{formatMoney(t.paidDT)} DT</dd>
            <dt>Dernier paiement</dt>
            <dd>{formatDate(t.lastPaidAt)}</dd>
            {t.bio && (<><dt>Bio</dt><dd style={{ fontWeight: 600 }}>{t.bio}</dd></>)}
          </dl>
          <p className="ens-field-hint" style={{ marginTop: "1rem" }}>
            Versement : <code>node scripts/payTeacher.js {t.phone} 100</code>
          </p>
        </div>
      </div>
    </div>
  );
}
