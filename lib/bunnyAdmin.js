import "server-only";
// Subset of Droussy's lib/bunny.js + lib/bunnyStorage.js — only what the admin
// preview needs. Same env variables as the platform.

import crypto from "crypto";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

/** Short-lived signed Bunny player URL — same token scheme as the platform. */
export function buildEmbedUrl(videoGuid, { ttlSec = 600, autoplay = false } = {}) {
  const libraryId = env("BUNNY_STREAM_LIBRARY_ID");
  const tokenKey = process.env.BUNNY_STREAM_TOKEN_KEY || env("BUNNY_STREAM_API_KEY");
  const expires = Math.floor(Date.now() / 1000) + ttlSec;
  const token = crypto.createHash("sha256").update(`${tokenKey}${videoGuid}${expires}`).digest("hex");
  const params = new URLSearchParams({
    token,
    expires: String(expires),
    autoplay: String(autoplay),
    preload: "true",
    responsive: "true",
  });
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoGuid}?${params.toString()}`;
}

let s3 = null;
function storage() {
  if (s3) return s3;
  const zone = env("BUNNY_STORAGE_ZONE").trim();
  const region = (process.env.BUNNY_STORAGE_REGION || "de").trim().toLowerCase();
  s3 = new S3Client({
    region,
    endpoint: `https://${region}-s3.storage.bunnycdn.com`,
    forcePathStyle: true,
    credentials: { accessKeyId: zone, secretAccessKey: env("BUNNY_STORAGE_PASSWORD").trim() },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return s3;
}

/** Short-lived read link for a PDF stored on Bunny Storage (videos/{id}.storageKey). */
export async function presignPdfRead(key, ttlSec = 600) {
  return getSignedUrl(storage(), new GetObjectCommand({ Bucket: env("BUNNY_STORAGE_ZONE").trim(), Key: key }), {
    expiresIn: ttlSec,
  });
}
