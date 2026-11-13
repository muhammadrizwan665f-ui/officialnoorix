import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Context, MiddlewareHandler } from 'hono';
import type { HonoEnv } from '../types';
import { AppError, clientIp } from './http';
import { randomToken, sha256Hex, timingSafeEqual } from './crypto';

export const COOKIE = 'nx_admin';
const SESSION_HOURS = 8;

export async function createSession(c: Context<HonoEnv>, userId: string) {
  const token = randomToken(32);
  const csrf = randomToken(24);
  const exp = new Date(Date.now() + SESSION_HOURS * 3600_000).toISOString().replace('T', ' ').slice(0, 19);
  await c.env.DB.prepare('INSERT INTO admin_sessions(id,user_id,csrf,expires_at,ip,ua) VALUES(?,?,?,?,?,?)')
    .bind(await sha256Hex(token), userId, csrf, exp, clientIp(c.req.raw), (c.req.header('user-agent') ?? '').slice(0, 200)).run();
  setCookie(c, COOKIE, token, { httpOnly: true, secure: new URL(c.req.url).protocol === 'https:', sameSite: 'Strict', path: '/', maxAge: SESSION_HOURS * 3600 });
  return csrf;
}

export async function destroySession(c: Context<HonoEnv>) {
  const t = getCookie(c, COOKIE);
  if (t) await c.env.DB.prepare('DELETE FROM admin_sessions WHERE id=?').bind(await sha256Hex(t)).run();
  deleteCookie(c, COOKIE, { path: '/' });
}

/** Every /api/admin route except login/setup passes through this. */
export const requireAdmin: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const t = getCookie(c, COOKIE);
  if (!t) throw new AppError(401, 'unauthorized', 'Please sign in.');
  const row = await c.env.DB.prepare(
    `SELECT s.id sid, s.csrf, u.id, u.email, u.name FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id
     WHERE s.id=? AND s.expires_at > datetime('now')`
  ).bind(await sha256Hex(t)).first<{ sid: string; csrf: string; id: string; email: string; name: string }>();
  if (!row) { deleteCookie(c, COOKIE, { path: '/' }); throw new AppError(401, 'unauthorized', 'Your session has expired. Please sign in again.'); }
  const m = c.req.method;
  if (m !== 'GET' && m !== 'HEAD') {
    // CSRF: same-origin Origin header AND a per-session token the page must echo back.
    const origin = c.req.header('origin');
    if (origin && origin !== new URL(c.req.url).origin) throw new AppError(403, 'forbidden', 'Cross-site request blocked.');
    const sent = c.req.header('x-csrf-token') ?? '';
    if (!sent || !timingSafeEqual(sent, row.csrf)) throw new AppError(403, 'csrf', 'Security token missing or invalid. Refresh the page and try again.');
  }
  c.set('admin', { user: { id: row.id, email: row.email, name: row.name }, sessionId: row.sid, csrf: row.csrf });
  await next();
};
