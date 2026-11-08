import Link from "next/link";
import VideoThumbnail from "./VideoThumbnail";
import ReviewButtons from "./ReviewButtons";
import { CONTENT_TYPES, getPdfCategory } from "@/lib/platform/videoConfig";
import { getSubjectEmoji, shortGradeLabel } from "@/lib/platform/videoDisplay";
import { ALL_GRADES } from "@/lib/platform/liveGrades";
import { statusLabel, statusChipClass, formatDuration, formatViews, formatDate } from "@/lib/ui";

// The platform card (app/components/DocumentCards.js → ContentCard), same markup
// and classes, as a link to the admin page + an admin footer (status, actions).
export default function AdminContentCard({ item, showGrade = true, showTeacher = true }) {
  const pdf = item.type === CONTENT_TYPES.PDF;
  const category = pdf ? getPdfCategory(item.pdfCategory) : null;
  const badge = pdf
    ? item.pageCount
      ? `${item.pageCount} page${item.pageCount > 1 ? "s" : ""}`
      : ""
    : formatDuration(item.durationSec);
  const fullGrade = item.gradeName || ALL_GRADES.find((g) => g.id === item.gradeId)?.name || "";
  const spec = item.specializationName || "";
  const levelChip = showGrade ? [shortGradeLabel(fullGrade), spec].filter(Boolean).join(" · ") : spec;
  const subjectLabel = `${getSubjectEmoji(item.subjectId, item.subjectEmoji)} ${item.subjectName || ""}`.trim();
  const secondLine = pdf
    ? [category && `${category.emoji} ${category.label}`, item.hasCorrection && "✅ Corrigé", showTeacher && item.teacherName]
        .filter(Boolean)
        .join(" · ")
    : showTeacher
      ? item.teacherName
      : "";

  return (
    <div className="adm-card">
      <Link href={`/contenus/${item.id}`} className="vid-card" title={item.title}>
        <div className="vid-thumb">
          <VideoThumbnail video={item} />
          {badge && <span className={`vid-duration ${pdf ? "vid-badge-pdf" : ""}`}>{badge}</span>}
          {item.isOpen && <span className="vid-free-badge">Gratuit</span>}
          <span className="vid-play-overlay">
            <span>{pdf ? "📖" : "▶"}</span>
          </span>
        </div>
        <div className="vid-card-body">
          <p className="vid-card-title">{item.title}</p>
          <p className={`vid-card-teacher ${pdf ? "vid-card-doctype" : ""}`}>{secondLine || " "}</p>
          <div className="vid-card-meta">
            {levelChip && (
              <span className="vid-chip-grade" title={[fullGrade, spec].filter(Boolean).join(" · ")}>
                {levelChip}
              </span>
            )}
            <span className="vid-chip-subject" title={item.subjectName}>
              {subjectLabel}
            </span>
            <span className="vid-card-views">👁 {formatViews(item.views)}</span>
          </div>
        </div>
      </Link>

      <div className="adm-card-foot">
        <span className={statusChipClass(item.status)}>
          {statusLabel(item.status)}
          {item.status === "encoding" && item.encodeProgress != null ? ` ${item.encodeProgress}%` : ""}
        </span>
        <span className="adm-card-date adm-grow">{formatDate(item.uploadedAt || item.createdAt)}</span>
        {item.status === "pending" && (
          <div className="adm-card-actions">
            <ReviewButtons id={item.id} />
          </div>
        )}
      </div>
    </div>
  );
}
