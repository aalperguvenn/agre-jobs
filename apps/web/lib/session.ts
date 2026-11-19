import { createHash, randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'aj_sid';

/**
 * Anonymous, first-party session id → daily-rotating hash. No IP or user agent is stored anywhere (KVKK).
 * The raw cookie never reaches the database; the hash changes every day, so clicks cannot be joined across days.
 */
export async function dailySessionHash(): Promise<string> {
  const jar = await cookies();
  let sid = jar.get(COOKIE)?.value;
  if (!sid) {
    sid = randomUUID();
    jar.set(COOKIE, sid, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24 * 30, path: '/' });
  }
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${sid}|${day}|${process.env.SESSION_HASH_SECRET ?? ''}`).digest('hex').slice(0, 32);
}
