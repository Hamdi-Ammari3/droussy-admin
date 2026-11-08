// lib/phone.js

// Accepts messy input ("22 942 420", "+21622942420", "0021622942420", "22942420")
// and returns the canonical 8-digit Tunisian mobile number, or null if invalid.
// The returned value is digits-only with no spaces/prefixes — e.g. "51510183".
//
// The country code is only removed when it is really a prefix, i.e. when the
// number is LONGER than 8 digits. A real number that starts with 216
// ("21654870" + 2 digits) is 8 digits long, so it is kept as is.
function normalizePhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("00216")) digits = digits.slice(5); // 00216 + 8 digits
  else if (digits.length === 11 && digits.startsWith("216")) digits = digits.slice(3); // 216 + 8 digits
  if (!/^\d{8}$/.test(digits)) return null;
  return digits;
}

// The Firestore doc id / Firebase Auth uid IS the canonical phone number
// now — no prefix. Kept as a named function so call sites stay readable
// and so there's one place to change if this ever needs to differ again.
function buildUid(canonicalPhone) {
  return canonicalPhone;
}

module.exports = { normalizePhone, buildUid };