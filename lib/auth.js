import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionValue } from '@/lib/session';

// Call at the top of every server action (middleware protects pages; this protects mutations too).
export async function requireAdmin() {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionValue(value))) throw new Error('Non autorisé');
}
