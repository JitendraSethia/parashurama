import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { DB } from './db';

export type Role = 'trainee' | 'instructor' | 'commander' | 'admin';
export interface User { id: number; username: string; name: string; role: Role; unit: string; settings: any; }
const N = 16384, KEYLEN = 64;
export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  return `scrypt$${N}$${salt.toString('base64')}$${scryptSync(pw, salt, KEYLEN, { N }).toString('base64')}`;
}
export function verifyPassword(pw: string, stored: string): boolean {
  const [alg, n, s, h] = stored.split('$');
  if (alg !== 'scrypt') return false;
  const exp = Buffer.from(h, 'base64');
  const got = scryptSync(pw, Buffer.from(s, 'base64'), exp.length, { N: +n });
  return got.length === exp.length && timingSafeEqual(got, exp);
}
const sha = (t: string) => createHash('sha256').update(t).digest('hex');
export const SESSION_HOURS = 12;
export function createSession(db: DB, userId: number): string {
  const token = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').run(sha(token), userId, Date.now() + SESSION_HOURS * 3600e3, Date.now());
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  return token;
}
export function userForToken(db: DB, token: string | undefined): User | null {
  if (!token) return null;
  const r = db.prepare(`SELECT u.id,u.username,u.name,u.role,u.unit,u.settings FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND u.disabled=0`).get(sha(token), Date.now()) as any;
  return r ? { ...r, settings: JSON.parse(r.settings || '{}') } : null;
}
export function dropSession(db: DB, token: string | undefined) { if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(token)); }
export function createUser(db: DB, u: { username: string; name: string; role: Role; unit?: string; password: string }): number {
  const r = db.prepare('INSERT INTO users(username,name,role,unit,pass,created_at) VALUES(?,?,?,?,?,?)').run(u.username, u.name, u.role, u.unit ?? 'Unit', hashPassword(u.password), Date.now());
  return Number(r.lastInsertRowid);
}
/** Simple fixed-window limiter (per key). */
export class Limiter {
  private hits = new Map<string, { n: number; t: number }>();
  constructor(private max: number, private windowMs: number) {}
  hit(key: string): boolean {
    const now = Date.now(), h = this.hits.get(key);
    if (!h || now - h.t > this.windowMs) { this.hits.set(key, { n: 1, t: now }); return true; }
    h.n++; return h.n <= this.max;
  }
  reset(key: string) { this.hits.delete(key); }
}
