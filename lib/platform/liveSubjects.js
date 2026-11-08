export const ALL_SUBJECTS = [
  { id: "maths", name: "Mathématiques", emoji: "➗" },
  { id: "physique", name: "Physique-Chimie", emoji: "🔬" },
  { id: "eveilsc", name: "Éveil scientifique", emoji: "🔬" },
  { id: "svt", name: "Sciences de la Vie et de la Terre", emoji: "🌱" },
  { id: "francais", name: "Français", emoji: "📖" },
  { id: "arabe", name: "Arabe", emoji: "📗" },
  { id: "histgeo", name: "Histoire-Géographie", emoji: "🗺️" },
  { id: "philo", name: "Philosophie", emoji: "🤔" },
  { id: "pensee-islamique", name: "Pensée islamique", emoji: "🕌" },
  { id: "anglais", name: "Anglais", emoji: "🌍" },
  { id: "allemand", name: "Allemand", emoji: "🇩🇪" },
  { id: "italien", name: "Italien", emoji: "🇮🇹" },
  { id: "espagnol", name: "Espagnol", emoji: "🇪🇸" },
  { id: "russe", name: "Russe", emoji: "🇷🇺" },
  { id: "informatique", name: "Informatique", emoji: "💻" },
  { id: "technique", name: "Technique", emoji: "⚙️" },
  { id: "economie", name: "Économie et Gestion", emoji: "📊" },
];

const GRADE_ORDER = [
  "prim-1", "prim-2", "prim-3", "prim-4", "prim-5", "prim-6",
  "col-7", "col-8", "col-9",
  "sec-1", "sec-2", "sec-3", "bac",
];

function gradeIndex(gradeId) {
  return GRADE_ORDER.indexOf(gradeId);
}

const SUBJECT_STARTS_AT = {
  histgeo: "prim-5", // التاريخ و الجغرافيا — from 5ème année primaire up to the bac
  philo: "sec-3", // الفلسفة — 3ème année secondaire + bac
  "pensee-islamique": "sec-1", // التفكير الإسلامي — lycée (sec-1 → bac)
  physique: "col-7",
  svt: "col-7",
  informatique: "col-7",
  technique: "col-7", // éducation technologique (collège) → technique (lycée, bac)
  allemand: "col-7",
  italien: "col-7",
  espagnol: "col-7",
  russe: "col-7",
  economie: "sec-2",
};

const SUBJECT_ENDS_AT = {
  eveilsc: "prim-6",
};

export function getSubjectsForGrade(gradeId) {
  const idx = gradeIndex(gradeId);
  if (idx === -1) return ALL_SUBJECTS;

  return ALL_SUBJECTS.filter((s) => {
    const startId = SUBJECT_STARTS_AT[s.id];
    const startIdx = startId ? gradeIndex(startId) : -1;
    if (startIdx !== -1 && idx < startIdx) return false;

    const endId = SUBJECT_ENDS_AT[s.id];
    const endIdx = endId ? gradeIndex(endId) : -1;
    if (endIdx !== -1 && idx > endIdx) return false;

    return true;
  });
}