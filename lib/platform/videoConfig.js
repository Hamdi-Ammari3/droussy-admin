// Shared video rules — safe to import from both client and server code
// (no secrets here).

export const VIEW_RATE_DT = 0.1; // 0,1 DT per unique qualified view
export const VIEW_RATE_MILLIMES = 100; // same rate in integer millimes (no float drift in totals)

// PDFs pay half: 0,05 DT per unique qualified read.
export const PDF_VIEW_RATE_DT = 0.05;
export const PDF_VIEW_RATE_MILLIMES = 50;

// When a PDF read counts (once per student per PDF):
// at least half of the pages really displayed (each ≥ 2 s on screen)
// AND at least 30 s of reading in total.
export const PDF_PAGE_RATIO = 0.5;
export const PDF_PAGE_DWELL_MS = 2000;
export const PDF_MIN_READ_SEC = 30;
export const PDF_HEARTBEAT_MS = 15000;
export const PDF_URL_TTL_SEC = 300; // signed file link lifetime (the viewer downloads it at once)
export const PAYOUT_THRESHOLD_DT = 100; // teacher is paid once the balance reaches this amount

// Teacher account fields (users/{teacherId}) — all money in integer millimes.
// Written ONLY by the server (heartbeat route + payout script).
export const TEACHER_FIELDS = {
  BALANCE: "videoBalanceMillimes", // earned, not yet paid → reset by payouts
  VIEWS_TOTAL: "videoViewsTotal", // all-time qualified views
  EARNED_TOTAL: "videoEarnedMillimes", // all-time earnings
  PAID_TOTAL: "videoPaidMillimes", // all-time amount paid out
};

export function millimesToDT(millimes) {
  return Math.round(Number(millimes) || 0) / 1000;
}
export const VIEW_THRESHOLD = 0.5; // a student must really watch 50% of the video's distinct chunks

// View tracking
export const CHUNK_SEC = 10; // the video is split in 10-second chunks
export const CHUNK_PLAYED_RATIO = 0.8; // a chunk counts once 80% of it actually played
export const HEARTBEAT_MS = 15000; // browser → server progress report interval
export const MAX_PLAYBACK_RATE = 2; // fastest speed we accept (2x)
export const REQUIRE_REVIEW = true; // encoded videos go to "pending" until an admin publishes them

export const MIN_DURATION_SEC = 120; // blocks very short clips gaming the 40% threshold
export const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
export const MAX_THUMB_BYTES = 5 * 1024 * 1024; // 5 MB

// How video cards look:
//   "generated" → branded thumbnail drawn in code (subject color, title, grade, Droussy TN)
//   "image"     → the saved thumbnailUrl (the Cloudinary default below)
// Every video still stores DEFAULT_THUMBNAIL_URL, so switching back is this one line.
export const THUMBNAIL_MODE = "generated";

// One shared thumbnail for every video (teachers no longer upload one).
// ⚠️ Never delete this image from Cloudinary — every video points to it.
export const DEFAULT_THUMBNAIL_URL =
  "https://res.cloudinary.com/da7le3nha/image/upload/v1790617653/droussy/thumbnails/51510183/il15xdhhx1hcjwuzcxhb.webp";
export const DEFAULT_THUMBNAIL_PUBLIC_ID = "droussy/thumbnails/51510183/il15xdhhx1hcjwuzcxhb";

// ---------------------------------------------------------------------------
// Content types — videos and PDFs live in the same `videos` collection,
// told apart by `type` ("video" when missing, for older docs).
// ---------------------------------------------------------------------------
export const CONTENT_TYPES = { VIDEO: "video", PDF: "pdf" };

export function contentTypeOf(doc) {
  return doc?.type === CONTENT_TYPES.PDF ? CONTENT_TYPES.PDF : CONTENT_TYPES.VIDEO;
}

export const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MB — enough for scanned devoirs

// How Tunisian students search for PDFs. `needsTrimestre` makes the
// trimester required (e.g. "Devoir de contrôle n°1 · T1").
export const PDF_CATEGORIES = [
  { id: "cours", label: "Cours / Résumé", emoji: "📘", needsTrimestre: false },
  { id: "serie", label: "Série d'exercices", emoji: "✏️", needsTrimestre: false },
  { id: "exercices-corriges", label: "Exercices corrigés", emoji: "✅", needsTrimestre: false },
  { id: "devoir-controle", label: "Devoir de contrôle", emoji: "📝", needsTrimestre: true },
  { id: "devoir-synthese", label: "Devoir de synthèse", emoji: "📝", needsTrimestre: true },
  { id: "examen-national", label: "Examen national", emoji: "🎯", needsTrimestre: false },
];

export function getPdfCategory(id) {
  return PDF_CATEGORIES.find((c) => c.id === id) || null;
}

export const TITLE_MIN = 5;
export const TITLE_MAX = 120;

export const TRIMESTRES = [
  { id: 1, label: "Trimestre 1" },
  { id: 2, label: "Trimestre 2" },
  { id: 3, label: "Trimestre 3" },
];

// Lifecycle of a video doc:
// uploading → encoding → pending (review) → published
//                      ↘ failed             ↘ rejected
export const VIDEO_STATUS = {
  UPLOADING: "uploading",
  ENCODING: "encoding",
  PENDING: "pending",
  PUBLISHED: "published",
  REJECTED: "rejected",
  FAILED: "failed",
};

export const STATUS_LABELS = {
  uploading: "⏫ Envoi en cours",
  encoding: "⚙️ Traitement",
  pending: "⏳ En validation",
  published: "✅ Publiée",
  rejected: "❌ Refusée",
  failed: "⚠️ Échec de l'envoi",
};

// Statuses that are still changing and worth polling from the dashboard.
export const IN_PROGRESS_STATUSES = ["uploading", "encoding"];

export const BUNNY_TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";