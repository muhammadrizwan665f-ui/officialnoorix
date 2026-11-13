export class AppError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const bad = (msg: string, code = 'invalid') => new AppError(400, code, msg);
export const notFound = (msg = 'Not found') => new AppError(404, 'not_found', msg);

export function clientIp(req: Request): string {
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
export const nowIso = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
