"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionValue } from "@/lib/session";
import { publishContent, rejectContent } from "@/lib/data/content";
import { createStudent, createTeacher, activatePaid, startTrial } from "@/lib/data/users";

export async function loginAction(_prev, formData) {
  const password = String(formData.get("password") || "");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    await new Promise((r) => setTimeout(r, 800)); // slows down guessing
    return { error: "Mot de passe incorrect." };
  }
  (await cookies()).set(SESSION_COOKIE, await createSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  redirect("/contenus");
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export async function publishAction(id) {
  await requireAdmin();
  try {
    await publishContent(id);
  } catch (err) {
    return { error: err.message };
  }
  refresh();
  return { ok: true };
}

export async function rejectAction(id, reason) {
  await requireAdmin();
  try {
    await rejectContent(id, reason);
  } catch (err) {
    return { error: err.message };
  }
  refresh();
  return { ok: true };
}

export async function createAccountAction(_prev, formData) {
  await requireAdmin();
  const role = formData.get("role") === "teacher" ? "teacher" : "student";
  const name = String(formData.get("name") || "").trim().replace(/\s+/g, " ");
  const phone = String(formData.get("phone") || "");
  if (name.length < 2) return { error: "Le nom est obligatoire." };
  try {
    const account =
      role === "teacher"
        ? await createTeacher({ name, phone, sex: String(formData.get("sex") || "man") })
        : await createStudent({ name, phone, plan: formData.get("plan") === "trial" ? "trial" : "paid" });
    refresh();
    return { account: { ...account, role } };
  } catch (err) {
    return { error: err.message || "Erreur lors de la création du compte." };
  }
}

/** Trial → paid, or activate / renew a 12-month subscription. */
export async function activatePaidAction(uid) {
  await requireAdmin();
  try {
    const res = await activatePaid(uid);
    refresh();
    return { ok: true, ...res };
  } catch (err) {
    return { error: err.message };
  }
}

/** One-time 7-day / 30-document free trial for an existing account. */
export async function startTrialAction(uid) {
  await requireAdmin();
  try {
    const res = await startTrial(uid);
    refresh();
    return { ok: true, ...res };
  } catch (err) {
    return { error: err.message };
  }
}
