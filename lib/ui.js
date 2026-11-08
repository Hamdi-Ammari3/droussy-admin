// Display helpers shared by admin pages (client-safe).
import { STATUS_LABELS } from "@/lib/platform/videoConfig";

export const ADMIN_STATUSES = [
  { id: "pending", label: STATUS_LABELS.pending },
  { id: "published", label: STATUS_LABELS.published },
  { id: "encoding", label: STATUS_LABELS.encoding },
  { id: "uploading", label: STATUS_LABELS.uploading },
  { id: "rejected", label: STATUS_LABELS.rejected },
  { id: "failed", label: STATUS_LABELS.failed },
  { id: "deleted", label: "🗑️ Supprimé" },
];

export const statusLabel = (s) => ADMIN_STATUSES.find((x) => x.id === s)?.label || s || "—";

// Chip colors reuse the teacher dashboard classes (enseignantPage.css). 
export const statusChipClass = (s) =>
  ({
    published: "ens-video-chip ens-video-chip-ok",
    pending: "ens-video-chip adm-chip-warn",
    rejected: "ens-video-chip ens-video-chip-pdf",
    failed: "ens-video-chip ens-video-chip-pdf",
    deleted: "ens-video-chip ens-video-chip-muted",
  })[s] || "ens-video-chip";

export const formatNumber = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0));

export const formatMoney = (dt) =>
  (Number(dt) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 3 });

export const formatDate = (t) =>
  t ? new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Tunis" }) : "—";

export const daysLeft = (t) => (t ? Math.ceil((t - Date.now()) / 86_400_000) : null);

export function formatDuration(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export function formatViews(n = 0) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "").replace(".", ",")} k`;
  return String(n);
}

export const PLATFORM_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || "https://droussy.tn";
