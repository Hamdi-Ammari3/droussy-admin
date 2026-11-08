// Signed admin session cookie. Uses Web Crypto so it runs in middleware (edge) and Node.
export const SESSION_COOKIE = 'droussy_admin';
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 h

const enc = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function sign(value) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET missing or too short');
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(value)));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionValue() {
  const exp = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${exp}.${await sign(exp)}`;
}

export async function verifySessionValue(value) {
  try {
    if (!value) return false;
    const [exp, sig] = value.split('.');
    if (!exp || !sig || Number(exp) < Date.now()) return false;
    return safeEqual(await sign(exp), sig);
  } catch {
    return false;
  }
}
