// Subscription rules — shared by the browser (to show 🔒 / counters) and the
// API routes (the real enforcement). No Firebase imports here on purpose.
//
// A subscription gives access to EVERY document of the platform (all grades,
// all subjects). Behind the scenes, each subscription can open at most
// DOC_QUOTA different documents (re-opening one never counts twice) — a
// protection against one account shared by several students. Students never
// see the counter; they only get a "usage limit" window if they reach it.
//
// Stored on users/{uid}:
//   subscription: {
//     active: true,
//     cycleId: "c1730000000000",   // changes at each renewal → the counter restarts
//     quota: 1000,                 // documents allowed in this cycle
//     used: 12,                    // different documents opened in this cycle (server-written)
//     startedAt, endsAt            // endsAt: Timestamp / ISO date (null = no end date)
//     plan: "trial" | "paid",      // missing = "paid" (accounts created before the trial existed)
//   }
//   trialUsedAt                    // set when a free trial is given → one trial per phone, ever
//
// FREE TRIAL: plan "trial" = TRIAL_QUOTA documents for TRIAL_DAYS days.
// Views made during a trial are NEVER paid to teachers (video heartbeat +
// PDF progress routes). Unlike the paid limit, the trial limit can be shown
// to the student ("30 documents pendant 7 jours"). When it runs out (time or
// documents) the student sees the "trial_ended" window.
// and one doc per opened document: users/{uid}/openedDocs/{cycleId}_{docId}
//
// Set / renew a subscription with: node scripts/setSubscription.js

export const DOC_QUOTA = 1000;
export const SUBSCRIPTION_MONTHS = 12;
export const SUBSCRIPTION_PRICE_DT = 100;
export const LEGACY_CYCLE = "legacy";

export const TRIAL_DAYS = 7;
export const TRIAL_QUOTA = 30;
export const PLAN_TRIAL = "trial";
export const PLAN_PAID = "paid";

function toMillis(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v.toMillis === "function") return v.toMillis();
  if (typeof v.seconds === "number") return v.seconds * 1000; // Timestamp sent as JSON
  const ms = typeof v === "number" ? v : new Date(v).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** Students who bought a grade before the switch keep their access (counted from 0). */
function hasLegacyPurchase(profile) {
  return Array.isArray(profile?.purchasedGrades) && profile.purchasedGrades.some(Boolean);
}

/**
 * Where a user stands:
 * { state: "none" | "active" | "expired" | "inactive", active, quota, used, remaining, endsAt, cycleId, legacy,
 *   plan: "trial" | "paid" | null, trial }
 */
export function subscriptionStatus(profile, now = Date.now()) {
  const s = profile?.subscription;

  if (s && typeof s === "object") {
    const quota = Math.max(0, Number(s.quota) || DOC_QUOTA);
    const used = Math.max(0, Number(s.used) || 0);
    const endsAt = toMillis(s.endsAt);
    const expired = endsAt !== null && endsAt <= now;
    const state = s.active === false ? "inactive" : expired ? "expired" : "active";
    const plan = s.plan === PLAN_TRIAL ? PLAN_TRIAL : PLAN_PAID;
    return {
      state,
      active: state === "active",
      quota,
      used,
      remaining: Math.max(0, quota - used),
      startedAt: toMillis(s.startedAt),
      endsAt,
      cycleId: String(s.cycleId || LEGACY_CYCLE),
      legacy: false,
      plan,
      trial: plan === PLAN_TRIAL,
    };
  }

  if (hasLegacyPurchase(profile)) {
    return {
      state: "active",
      active: true,
      quota: DOC_QUOTA,
      used: 0,
      remaining: DOC_QUOTA,
      endsAt: null,
      cycleId: LEGACY_CYCLE,
      legacy: true,
      plan: PLAN_PAID,
      trial: false,
    };
  }

  return { state: "none", active: false, quota: 0, used: 0, remaining: 0, endsAt: null, cycleId: null, legacy: false, plan: null, trial: false };
}

/** True while a student is on the free trial (active or not) — his views are never paid. */
export function isTrialProfile(profile) {
  return profile?.subscription?.plan === PLAN_TRIAL;
}

/**
 * The code sent to the browser when a document is refused:
 * "none" | "expired" | "inactive" | "quota" | "trial_ended".
 * A trial that ran out of days or documents is always "trial_ended".
 */
export function deniedCode(status, reason = status?.state) {
  if (status?.trial && (reason === "expired" || reason === "quota")) return "trial_ended";
  return reason;
}

/** Teacher on his own content, or admin: free access, never counted. */
export function isFreeAccess(user, doc) {
  if (!user || !doc) return false;
  if (user.role === "admin") return true;
  return !!doc.teacherId && doc.teacherId === user.uid;
}

/**
 * Message shown when a document can't be opened (French, for students).
 * The 1000-documents limit is never mentioned to students: it only exists to
 * stop one account from being shared — they just see a "usage limit" message.
 */
export function accessDeniedMessage(state) {
  if (state === "trial_ended") {
    return "Ton essai gratuit est terminé. Abonne-toi pour continuer à ouvrir les vidéos et les PDF.";
  }
  if (state === "quota") {
    return "Ton compte a atteint sa limite d'utilisation. Contacte Droussy TN sur WhatsApp pour continuer.";
  }
  if (state === "expired") return "Ton abonnement a expiré. Renouvelle-le pour continuer à ouvrir les vidéos et les PDF.";
  if (state === "inactive") return "Ton abonnement est suspendu. Contacte Droussy TN sur WhatsApp.";
  return "Abonne-toi pour ouvrir les vidéos et les PDF de Droussy TN.";
}