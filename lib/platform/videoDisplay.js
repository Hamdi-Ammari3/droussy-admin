// Shared display rules for videos (client-safe). Used by the generated
// thumbnail, the videos page and the teacher dashboard.
//
// Source of truth for emojis = the platform lists (ALL_GRADES, ALL_SUBJECTS).
// The emoji saved on each video at upload time is only a fallback, so fixing
// an emoji in liveGrades / liveSubjects updates every existing video.

import { ALL_GRADES } from "./liveGrades";
import { ALL_SUBJECTS } from "./liveSubjects";

const GRADES_BY_ID = new Map(ALL_GRADES.map((g) => [g.id, g]));
const SUBJECTS_BY_ID = new Map(ALL_SUBJECTS.map((s) => [s.id, s]));

export function getGradeEmoji(gradeId = "") {
  return GRADES_BY_ID.get(gradeId)?.emoji || "🎒";
}

export function getGradeName(gradeId = "", storedName = "") {
  return storedName || GRADES_BY_ID.get(gradeId)?.name || "";
}

export function getSubjectEmoji(subjectId = "", storedEmoji = "") {
  return SUBJECTS_BY_ID.get(subjectId)?.emoji || storedEmoji || "📚";
}

export function getSubjectName(subjectId = "", storedName = "") {
  return SUBJECTS_BY_ID.get(subjectId)?.name || storedName || "";
}

// "3ème année secondaire" → "3ème sec", "7ème année" → "7ème", "5ème année primaire" → "5ème"
export function shortGradeLabel(name = "") {
  return String(name)
    .replace(/\s*année\s+secondaire/i, " sec")
    .replace(/\s*année\s+primaire/i, "")
    .replace(/\s*année\s+(de\s+base|collège|préparatoire)/i, "")
    .replace(/\s*année/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Subject → platform color token (+ fallback hex if the token isn't defined).
const PALETTE = {
  sky: "#8cc8ff",
  coral: "#ff8573",
  mint: "#73e0b4",
  grape: "#c796eb",
  sun: "#faca4b",
};

const SUBJECT_COLORS = {
  maths: "sky",
  physique: "coral",
  eveilsc: "coral",
  svt: "mint",
  francais: "grape",
  arabe: "sun",
  philo: "grape",
  "pensee-islamique": "mint",
  anglais: "mint",
  allemand: "grape",
  italien: "grape",
  espagnol: "grape",
  informatique: "sky",
  economie: "sun",
  histgeo: "sun",
  technique: "sky",
  russe: "grape",
};

/** Returns { token, cssColor } for a subject — cssColor uses the platform CSS variable. */
export function subjectTheme(subjectId = "") {
  let token = SUBJECT_COLORS[subjectId];
  if (!token) {
    // A subject added later still gets a stable platform color.
    const keys = Object.keys(PALETTE);
    let hash = 0;
    for (let i = 0; i < subjectId.length; i++) hash = (hash * 31 + subjectId.charCodeAt(i)) >>> 0;
    token = keys[hash % keys.length];
  }
  return { token, cssColor: `var(--home-${token}, ${PALETTE[token]})` };
}