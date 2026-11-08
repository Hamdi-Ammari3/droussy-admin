import "server-only";
import { adminDB, Timestamp } from "@/lib/firebaseAdmin";
import { memo, invalidate } from "@/lib/memo";
import { subscriptionStatus, DOC_QUOTA, SUBSCRIPTION_MONTHS } from "@/lib/platform/subscription";
import { TEACHER_FIELDS, millimesToDT } from "@/lib/platform/videoConfig";
import { normalizePhone, buildUid } from "@/lib/platform/phone";

const ms = (v) => {
  if (v == null || v === "") return null;
  if (typeof v.toMillis === "function") return v.toMillis();
  const t = typeof v === "number" ? v : new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
};

// The PIN (`password`) is never selected for the lists — only the teacher profile page reads it.
const LIST_FIELDS = ["name", "phone", "role", "sex", "createdAt", "subscription", "purchasedGrades"];
const TEACHER_LIST_FIELDS = [
  "name", "phone", "role", "sex", "createdAt",
  TEACHER_FIELDS.BALANCE, TEACHER_FIELDS.VIEWS_TOTAL, TEACHER_FIELDS.EARNED_TOTAL, TEACHER_FIELDS.PAID_TOTAL,
];

function toStudent(doc) {
  const d = doc.data();
  const sub = subscriptionStatus(d); // same rules as the platform (lib/subscription.js)
  return {
    id: doc.id,
    name: d.name || "(sans nom)",
    phone: d.phone || doc.id,
    createdAt: ms(d.createdAt),
    sub: {
      state: sub.state, // none | active | expired | inactive
      legacy: sub.legacy,
      used: sub.used,
      quota: sub.quota,
      startedAt: sub.startedAt ?? null,
      endsAt: sub.endsAt,
    },
  };
}

function toTeacher(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    name: d.name || "(sans nom)",
    phone: d.phone || doc.id,
    sex: d.sex || "",
    createdAt: ms(d.createdAt),
    balanceDT: millimesToDT(d[TEACHER_FIELDS.BALANCE]),
    viewsTotal: Number(d[TEACHER_FIELDS.VIEWS_TOTAL]) || 0,
    earnedDT: millimesToDT(d[TEACHER_FIELDS.EARNED_TOTAL]),
    paidDT: millimesToDT(d[TEACHER_FIELDS.PAID_TOTAL]),
  };
}

/** Students = every account that is not a teacher or an admin (same rule as scripts/setSubscription.js). */
export const getStudents = memo("students", async () => {
  const snap = await adminDB().collection("users").select(...LIST_FIELDS).get();
  return snap.docs.filter((d) => !["teacher", "admin"].includes(d.data().role)).map(toStudent);
});

export const getTeachers = memo("teachers", async () => {
  const snap = await adminDB().collection("users").where("role", "==", "teacher").select(...TEACHER_LIST_FIELDS).get();
  return snap.docs.map(toTeacher);
});

/** Full teacher profile, including the login PIN. */
export async function getTeacher(id) {
  const snap = await adminDB().collection("users").doc(id).get();
  if (!snap.exists || snap.data().role !== "teacher") return null;
  const d = snap.data();
  return {
    ...toTeacher(snap),
    password: d.password ?? "",
    bio: d.bio || "",
    lastPaidAt: ms(d.videoLastPaidAt),
  };
}

// ---------------------------------------------------------------------------
// Account creation — same documents as scripts/createStudentAccount.js and
// scripts/createTeacherAccount.js (login = phone + 4-digit PIN in `password`).
// ---------------------------------------------------------------------------

const generatePin = () => String(Math.floor(1000 + Math.random() * 9000));

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function createUserDoc(rawPhone, buildData) {
  const phone = normalizePhone(rawPhone);
  if (!phone) throw new Error("Numéro invalide : 8 chiffres attendus (ex : 22942420).");
  const uid = buildUid(phone);
  const ref = adminDB().collection("users").doc(uid);
  const pin = generatePin();
  const data = buildData({ phone, pin });
  try {
    await ref.create(data); // fails if this phone already has an account
  } catch (err) {
    if (err.code === 6) throw new Error(`Un compte existe déjà pour ${phone}.`);
    throw err;
  }
  return { uid, phone, pin, data };
}

export async function createStudent({ name, phone: rawPhone }) {
  const now = new Date();
  const endsAt = addMonths(now, SUBSCRIPTION_MONTHS);
  const { phone, pin } = await createUserDoc(rawPhone, ({ phone, pin }) => ({
    name,
    phone,
    password: pin,
    role: "student",
    subscription: {
      active: true,
      cycleId: `c${now.getTime()}`,
      quota: DOC_QUOTA,
      used: 0,
      startedAt: Timestamp.fromDate(now),
      endsAt: Timestamp.fromDate(endsAt),
    },
    createdAt: now.toISOString(),
  }));
  invalidate("students");
  return { name, phone, pin, endsAt: endsAt.getTime() };
}

export async function createTeacher({ name, phone: rawPhone, sex = "man" }) {
  const { phone, pin } = await createUserDoc(rawPhone, ({ phone, pin }) => ({
    name,
    phone,
    password: pin,
    role: "teacher",
    sex: sex === "woman" ? "woman" : "man",
    courses: [],
    bio: "",
    balance: 0,
    ratingAvg: 5,
    ratingCount: 1,
    ratingSum: 5,
    ratingWeighted: 5,
    totalSessions: 0,
    loginAttempts: { count: 0, windowStart: 0 },
    createdAt: new Date().toISOString(),
  }));
  invalidate("teachers");
  return { name, phone, pin };
}
