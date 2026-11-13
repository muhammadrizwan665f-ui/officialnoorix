export interface Env {
  DB: D1Database;
  FILES: R2Bucket;
  ASSETS: Fetcher;
  SITE_URL: string;
  SETUP_TOKEN?: string;
  TURNSTILE_SECRET?: string;
}
export type AdminCtx = { user: { id: string; email: string; name: string }; sessionId: string; csrf: string };
export type HonoEnv = { Bindings: Env; Variables: { admin: AdminCtx } };
