export const ALL_GRADES = [
  { id: "prim-1", name: "1ère année primaire", levelName: "Primaire", emoji: "🐣" },
  { id: "prim-2", name: "2ème année primaire", levelName: "Primaire", emoji: "🐢" },
  { id: "prim-3", name: "3ème année primaire", levelName: "Primaire", emoji: "🦋" },
  { id: "prim-4", name: "4ème année primaire", levelName: "Primaire", emoji: "🐬" },
  { id: "prim-5", name: "5ème année primaire", levelName: "Primaire", emoji: "🦁" },
  { id: "prim-6", name: "6ème année primaire", levelName: "Primaire", emoji: "🚀" },
  { id: "col-7", name: "7ème année", levelName: "Collège", emoji: "📘" },
  { id: "col-8", name: "8ème année", levelName: "Collège", emoji: "🔬" },
  { id: "col-9", name: "9ème année", levelName: "Collège", emoji: "📐" },
  { id: "sec-1", name: "1ère année secondaire", levelName: "Lycée", emoji: "📖" },
  { id: "sec-2", name: "2ème année secondaire", levelName: "Lycée", emoji: "📏" },
  { id: "sec-3", name: "3ème année secondaire", levelName: "Lycée", emoji: "🎯" },
  { id: "bac", name: "Bac", levelName: "Lycée", emoji: "🎓" },
];

export function groupGradesByLevel(list = ALL_GRADES) {
  const map = new Map();
  for (const g of list) {
    if (!map.has(g.levelName)) map.set(g.levelName, []);
    map.get(g.levelName).push(g);
  }
  return Array.from(map.entries()).map(([levelName, grades]) => ({ levelName, grades }));
}

export const GRADE_GROUPS = groupGradesByLevel();

// Filière specialization applies from 2ème année secondaire onward in the
// Tunisian system (students pick a track there and carry it through 3ème
// and the Bac), not just the Bac year itself.
export const GRADES_WITH_SPECIALIZATION = new Set(["sec-2", "sec-3", "bac"]);

export const SPECIALIZATIONS = [
  { id: "math", name: "Mathématiques" },
  { id: "sciences", name: "Sciences Expérimentales" },
  { id: "lettres", name: "Lettres" },
  { id: "economie", name: "Économie et Gestion" },
  { id: "technique", name: "Sciences Techniques" },
  { id: "informatique", name: "Sciences de l'Informatique" },
  { id: "sport", name: "Sport" },
];