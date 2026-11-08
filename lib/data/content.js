import "server-only";
import { adminDB, FieldValue } from "@/lib/firebaseAdmin";
import { memo, invalidate } from "@/lib/memo";
import { CONTENT_TYPES, contentTypeOf } from "@/lib/platform/videoConfig";
import { OPEN_DOCS_MIN, OPEN_DOC_ALIVE_STATUSES } from "@/lib/platform/openDocs";
import { normalizeText } from "@/lib/platform/videoText";

// Videos and PDFs share the `videos` collection (lib/videoConfig.js → CONTENT_TYPES).
const COLLECTION = "videos";

const ms = (v) => {
  if (v == null || v === "") return null;
  if (typeof v.toMillis === "function") return v.toMillis();
  const t = typeof v === "number" ? v : new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
};

// Only what the dashboard shows (select() keeps the download small).
const FIELDS = [
  "title", "type", "status", "isOpen", "views",
  "gradeId", "gradeName", "subjectId", "subjectName", "subjectEmoji",
  "specializationId", "specializationName", "pdfCategory", "hasCorrection", "pageCount",
  "durationSec", "encodeProgress", "teacherId", "teacherName",
  "createdAt", "uploadedAt", "publishedAt", "reviewedAt",
  "rejectionReason", "failureReason", "bunnyVideoId", "storageKey", "thumbnailUrl",
];

function toItem(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    title: d.title || "(sans titre)",
    type: contentTypeOf(d),
    status: d.status || "",
    isOpen: d.isOpen === true,
    views: Number(d.views) || 0,
    gradeId: d.gradeId || "",
    gradeName: d.gradeName || "",
    subjectId: d.subjectId || "",
    subjectName: d.subjectName || "",
    subjectEmoji: d.subjectEmoji || "",
    specializationId: d.specializationId || "",
    specializationName: d.specializationName || "",
    pdfCategory: d.pdfCategory || "",
    hasCorrection: !!d.hasCorrection,
    pageCount: d.pageCount || null,
    durationSec: Number(d.durationSec) || 0,
    encodeProgress: d.encodeProgress ?? null,
    teacherId: d.teacherId || "",
    teacherName: d.teacherName || "",
    createdAt: ms(d.createdAt),
    uploadedAt: ms(d.uploadedAt),
    publishedAt: ms(d.publishedAt),
    reviewedAt: ms(d.reviewedAt),
    rejectionReason: d.rejectionReason || "",
    failureReason: d.failureReason || "",
    bunnyVideoId: d.bunnyVideoId || "",
    storageKey: d.storageKey || "",
    thumbnailUrl: d.thumbnailUrl || "",
  };
}

/** Every document, any status (the platform catalog only reads "published"). */
export const getAllContent = memo("content", async () => {
  const snap = await adminDB().collection(COLLECTION).select(...FIELDS).get();
  return snap.docs.map(toItem);
});

export async function getContent(id) {
  const snap = await adminDB().collection(COLLECTION).doc(id).get();
  return snap.exists ? toItem(snap) : null;
}

// ---------------------------------------------------------------------------
// Filters — same URL names as the platform catalog
// (?niveau=&section=&matiere=&type=&doc=&gratuit=1&q=) + admin ones:
// ?tri=populaires|recentes  (the old home-page sort)   ?statut=pending|…
// ---------------------------------------------------------------------------

export function readFilters(sp = {}) {
  const one = (k) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) || "";
  const type = one("type");
  return {
    q: one("q").slice(0, 80),
    grade: one("niveau") || "all",
    section: one("section") || "all",
    subject: one("matiere") || "all",
    type: type === CONTENT_TYPES.VIDEO || type === CONTENT_TYPES.PDF ? type : "all",
    docCategory: one("doc") || "all",
    free: one("gratuit") === "1",
    sort: one("tri") === "recentes" ? "recentes" : "populaires",
    status: one("statut") || "all",
    limit: Math.min(2000, Math.max(40, Number(one("n")) || 40)),
  };
}

function matches(item, f, skip = "") {
  if (skip !== "status") {
    if (f.status === "all" ? item.status === "deleted" : item.status !== f.status) return false;
  }
  if (skip !== "grade" && f.grade !== "all" && item.gradeId !== f.grade) return false;
  if (skip !== "section" && f.section !== "all" && item.specializationId !== f.section) return false;
  if (skip !== "subject" && f.subject !== "all" && item.subjectId !== f.subject) return false;
  if (skip !== "type" && f.type !== "all" && item.type !== f.type) return false;
  if (skip !== "doc" && f.type === CONTENT_TYPES.PDF && f.docCategory !== "all" && item.pdfCategory !== f.docCategory) return false;
  if (skip !== "free" && f.free && !item.isOpen) return false;
  if (f.q) {
    const hay = normalizeText(`${item.title} ${item.teacherName} ${item.subjectName} ${item.gradeName} ${item.id}`);
    const words = normalizeText(f.q).split(/\s+/).filter(Boolean);
    if (!words.every((w) => hay.includes(w))) return false;
  }
  return true;
}

const countBy = (items, key) => {
  const m = {};
  items.forEach((i) => (m[i[key]] = (m[i[key]] || 0) + 1));
  return m;
};

/** Filtered + sorted list, and the counts shown next to each filter option (like the platform). */
export function filterContent(all, f) {
  const items = all.filter((i) => matches(i, f));
  // Old home-page sort: 🔥 Populaires = views desc then newest, 🆕 Récents = newest first.
  const newest = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);
  items.sort(f.sort === "recentes" ? newest : (a, b) => b.views - a.views || newest(a, b));

  return {
    items,
    counts: {
      grade: countBy(all.filter((i) => matches(i, f, "grade")), "gradeId"),
      section: countBy(all.filter((i) => matches(i, f, "section")), "specializationId"),
      subject: countBy(all.filter((i) => matches(i, f, "subject")), "subjectId"),
      type: countBy(all.filter((i) => matches(i, f, "type")), "type"),
      doc: countBy(all.filter((i) => matches(i, f, "doc")), "pdfCategory"),
      status: countBy(all.filter((i) => matches(i, f, "status")), "status"),
    },
  };
}

// ---------------------------------------------------------------------------
// Review — same behaviour as scripts/Reviewcontent.js
// ---------------------------------------------------------------------------

/** Changes one document's status inside a transaction, only if it is still "pending". */
async function review(id, update) {
  const db = adminDB();
  const ref = db.collection(COLLECTION).doc(id);
  const before = await db.runTransaction(async (tx) => {
    const fresh = await tx.get(ref);
    const cur = fresh.exists ? fresh.data() : null;
    if (!cur) throw new Error("Document introuvable.");
    if (cur.status !== "pending") throw new Error(`Déjà traité (statut actuel : ${cur.status}).`);
    tx.update(ref, { ...update, reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return cur;
  });
  invalidate("content");
  return before;
}

export async function publishContent(id) {
  await review(id, { status: "published", publishedAt: FieldValue.serverTimestamp() });
}

export async function rejectContent(id, reason) {
  const before = await review(id, {
    status: "rejected",
    rejectionReason: reason ? String(reason).slice(0, 500) : null,
  });
  if (before.isOpen === true && before.teacherId) await ensureOpenDoc(before.teacherId);
}

/** Teacher has no free document left → his oldest published (or pending) one becomes free (lib/openDocs.js rule). */
async function ensureOpenDoc(teacherId) {
  const db = adminDB();
  const openSnap = await db.collection(COLLECTION).where("teacherId", "==", teacherId).where("isOpen", "==", true).get();
  if (openSnap.docs.filter((d) => OPEN_DOC_ALIVE_STATUSES.includes(d.data().status)).length >= OPEN_DOCS_MIN) return;

  const snap = await db.collection(COLLECTION).where("teacherId", "==", teacherId).where("status", "in", ["published", "pending"]).get();
  if (snap.empty) return;
  const byAge = [...snap.docs].sort((a, b) => (ms(a.data().createdAt) || 0) - (ms(b.data().createdAt) || 0));
  const pick = byAge.find((d) => d.data().status === "published") || byAge[0];
  await pick.ref.update({
    isOpen: true,
    openChangedAt: FieldValue.serverTimestamp(),
    openAutoReason: "replacement",
    updatedAt: FieldValue.serverTimestamp(),
  });
  invalidate("content");
}
