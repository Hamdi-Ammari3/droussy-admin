// Shared text helpers for video titles/search (safe on client and server).

export function normalizeText(str = "") {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function cleanTitle(str = "") {
  return String(str).trim().replace(/\s+/g, " ");
}

export function buildSearchKeywords(...parts) {
  const words = parts
    .filter(Boolean)
    .flatMap((p) => normalizeText(p).split(/[^\p{L}\p{N}]+/u))
    .filter((w) => w.length >= 2);
  return [...new Set(words)].slice(0, 40);
}