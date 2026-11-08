import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/data/content";
import { buildEmbedUrl, presignPdfRead } from "@/lib/bunnyAdmin";
import { CONTENT_TYPES, getPdfCategory } from "@/lib/platform/videoConfig";
import { getGradeName, getSubjectName, getSubjectEmoji, getGradeEmoji } from "@/lib/platform/videoDisplay";
import { statusLabel, statusChipClass, formatDate, formatDuration, formatNumber, PLATFORM_URL } from "@/lib/ui";
import ReviewButtons from "@/components/ReviewButtons";

async function previewUrl(c) {
  try {
    if (c.type === CONTENT_TYPES.PDF) return c.storageKey ? await presignPdfRead(c.storageKey) : null;
    if (c.bunnyVideoId && !["uploading", "failed"].includes(c.status)) return buildEmbedUrl(c.bunnyVideoId);
  } catch (err) {
    console.error("preview failed", c.id, err.message);
    return { error: err.message };
  }
  return null;
}

export default async function ContentDetail({ params }) {
  const { id } = await params;
  const c = await getContent(id);
  if (!c) notFound();

  const pdf = c.type === CONTENT_TYPES.PDF;
  const preview = await previewUrl(c);
  const category = pdf ? getPdfCategory(c.pdfCategory) : null;

  return (
    <div className="ens-board">
      <Link href="/contenus" className="adm-back">← Contenus</Link>
      <div className="ens-board-header">
        <div>
          <h1 className="ens-board-title" dir="auto">{c.title}</h1>
          <p className="ens-board-sub">
            {getGradeEmoji(c.gradeId)} {getGradeName(c.gradeId, c.gradeName)}
            {c.specializationName ? ` · ${c.specializationName}` : ""} · {getSubjectEmoji(c.subjectId, c.subjectEmoji)}{" "}
            {getSubjectName(c.subjectId, c.subjectName)}
          </p>
        </div>
        {c.status === "pending" && (
          <div className="ens-header-actions">
            <ReviewButtons id={c.id} size="lg" />
          </div>
        )}
      </div>

      <div className="adm-detail">
        <div className="adm-box">
          {preview?.error ? (
            <div className="adm-preview-empty">⚠️ Aperçu indisponible : {preview.error}</div>
          ) : !preview ? (
            <div className="adm-preview-empty">
              {c.status === "uploading"
                ? "⏫ L'enseignant est encore en train d'envoyer le fichier."
                : c.status === "failed"
                  ? `⚠️ Échec de l'envoi${c.failureReason ? ` (${c.failureReason})` : ""}.`
                  : "Aucun fichier lié à ce document."}
            </div>
          ) : pdf ? (
            <iframe className="adm-pdf" src={preview} title={c.title} />
          ) : (
            <iframe
              className="adm-player"
              src={preview}
              title={c.title}
              allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          )}
          {c.status === "encoding" && preview && (
            <p className="ens-field-hint" style={{ marginTop: "0.6rem" }}>
              ⚙️ Bunny traite encore la vidéo{c.encodeProgress != null ? ` (${c.encodeProgress}%)` : ""} : la lecture peut ne pas encore marcher.
            </p>
          )}
        </div>

        <div className="adm-box">
          <h2 className="adm-box-title">Détails</h2>
          <dl className="adm-kv">
            <dt>Statut</dt>
            <dd><span className={statusChipClass(c.status)}>{statusLabel(c.status)}</span></dd>
            <dt>Type</dt>
            <dd>{pdf ? `📄 PDF${category ? ` · ${category.emoji} ${category.label}` : ""}${c.hasCorrection ? " · ✅ Corrigé" : ""}` : "🎬 Vidéo"}</dd>
            <dt>{pdf ? "Pages" : "Durée"}</dt>
            <dd>{pdf ? c.pageCount || "—" : formatDuration(c.durationSec) || "—"}</dd>
            <dt>Accès</dt>
            <dd>{c.isOpen ? "🔓 Gratuit (visible sans compte)" : "Abonnés"}</dd>
            <dt>Vues</dt>
            <dd>{formatNumber(c.views)}</dd>
            <dt>Enseignant</dt>
            <dd>
              {c.teacherId ? (
                <Link className="adm-link" href={`/enseignants/${c.teacherId}`}>{c.teacherName || c.teacherId}</Link>
              ) : "—"}
            </dd>
            <dt>Envoyé le</dt>
            <dd>{formatDate(c.uploadedAt || c.createdAt)}</dd>
            {c.publishedAt && (<><dt>Publié le</dt><dd>{formatDate(c.publishedAt)}</dd></>)}
            {c.reviewedAt && (<><dt>Revu le</dt><dd>{formatDate(c.reviewedAt)}</dd></>)}
            <dt>ID</dt>
            <dd className="adm-mono" style={{ fontSize: "0.8rem" }}>{c.id}</dd>
          </dl>
          {c.status === "rejected" && c.rejectionReason && <p className="adm-note">Raison du refus : {c.rejectionReason}</p>}
          {c.status === "published" && (
            <div className="adm-actions">
              <a className="adm-btn" href={`${PLATFORM_URL}/enseignants/${c.teacherId}`} target="_blank" rel="noopener noreferrer">
                👀 Voir sur Droussy TN
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
