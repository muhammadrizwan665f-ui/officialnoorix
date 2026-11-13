export class ApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
let csrf = '';
export const setCsrf = (t: string) => { csrf = t; };

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const method = opts.method ?? (opts.body || opts.form ? 'POST' : 'GET');
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (csrf && method !== 'GET') headers['x-csrf-token'] = csrf;
  let res: Response;
  try { res = await fetch(path, { method, headers, credentials: 'same-origin', body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined) }); }
  catch { throw new ApiError(0, 'network', 'Network error. Please check your connection and try again.'); }
  const ct = res.headers.get('content-type') ?? '';
  const data = ct.includes('json') ? await res.json().catch(() => null) : null;
  if (!res.ok) throw new ApiError(res.status, data?.error?.code ?? 'error', data?.error?.message ?? `Request failed (${res.status})`);
  return data as T;
}

export const getCsrf = () => csrf;

/** Uploads one image with real progress events (fetch cannot report upload progress). */
export function uploadImage(file: File, onProgress?: (pct: number) => void): Promise<{ url: string; key: string }> {
  return new Promise((resolve, reject) => {
    const okTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!okTypes.includes(file.type)) return reject(new ApiError(0, 'bad_type', `"${file.name}" is not a supported image. Use PNG, JPG, WebP or GIF.`));
    if (file.size > 5 * 1024 * 1024) return reject(new ApiError(0, 'too_large', `"${file.name}" is larger than 5 MB.`));
    const fd = new FormData(); fd.set('file', file);
    const x = new XMLHttpRequest();
    x.open('POST', '/api/admin/upload'); x.setRequestHeader('x-csrf-token', csrf);
    x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
    x.onerror = () => reject(new ApiError(0, 'network', 'Network error while uploading. Please try again.'));
    x.onload = () => {
      let d: any = null; try { d = JSON.parse(x.responseText); } catch { /* ignore */ }
      if (x.status >= 200 && x.status < 300 && d?.url) resolve(d); else reject(new ApiError(x.status, d?.error?.code ?? 'error', d?.error?.message ?? `Upload failed (${x.status})`));
    };
    x.send(fd);
  });
}
