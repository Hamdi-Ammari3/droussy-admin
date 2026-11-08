import "server-only";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

// Same env variables as Droussy TN (lib/firebaseAdmin.js) — copy them from its .env.
// Lazy so `next build` never needs the credentials.
function getAdminApp() {
  if (getApps().length) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminDB = () => getFirestore(getAdminApp());
export const adminAuth = () => getAuth(getAdminApp());
export { FieldValue, Timestamp };
