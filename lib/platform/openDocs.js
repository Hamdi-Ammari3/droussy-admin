// Open (free) documents — shared rules, safe for browser and server (no Firebase here).
//
// A teacher's open documents can be watched / read by anyone, even without an
// account. They are never paid, never counted as views, and don't use the
// student's subscription limit.
//
// Rules (enforced by the server — lib/openDocsServer.js):
//   - the first document a teacher submits is open automatically;
//   - a teacher always keeps between OPEN_DOCS_MIN and OPEN_DOCS_MAX open documents;
//   - he changes which ones from the ⋮ menu of his dashboard.
//
// Stored on videos/{id}: isOpen: true | false (missing = false).

export const OPEN_DOCS_MIN = 1;
export const OPEN_DOCS_MAX = 3;

// Documents that still "exist" for the teacher (count toward his open documents).
export const OPEN_DOC_ALIVE_STATUSES = ["uploading", "encoding", "pending", "published"];

// Documents a teacher can switch between open / paid from his dashboard.
export const OPEN_DOC_TOGGLE_STATUSES = ["pending", "published"];

/** Open document that students can see right now (free for everyone). */
export function isOpenDoc(doc) {
  return doc?.isOpen === true && doc.status === "published";
}

export const OPEN_DOC_MESSAGES = {
  max: `Maximum ${OPEN_DOCS_MAX} documents gratuits. Rends-en un payant d'abord.`,
  min: `Tu dois garder au moins ${OPEN_DOCS_MIN} document gratuit : c'est ta vitrine pour les élèves.`,
  status: "Ce document ne peut pas encore être rendu gratuit (envoi ou traitement en cours).",
};