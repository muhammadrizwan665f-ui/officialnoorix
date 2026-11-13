import type { Env } from '../types';
import { AppError, bad } from './http';
import { uid } from './crypto';

export const MAX_UPLOAD = 5 * 1024 * 1024;
const SIGS: { type: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { type: 'image/png', ext: 'png', test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/gif', ext: 'gif', test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  { type: 'image/webp', ext: 'webp', test: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
];

/** Validates by file CONTENT (magic bytes), not by the client-supplied type/extension. SVG is deliberately refused (script risk). */
export async function saveUpload(env: Env, file: File): Promise<{ key: string; url: string; size: number; type: string }> {
  if (!file || typeof file === 'string') throw bad('No file received');
  if (file.size === 0) throw bad('The file is empty');
  if (file.size > MAX_UPLOAD) throw new AppError(413, 'too_large', `Image is too large. Maximum size is ${MAX_UPLOAD / 1024 / 1024} MB.`);
  const buf = new Uint8Array(await file.arrayBuffer());
  const sig = SIGS.find((s) => s.test(buf));
  if (!sig) throw new AppError(415, 'bad_type', 'Unsupported file. Please upload a PNG, JPG, WebP or GIF image.');
  const key = `uploads/${uid()}.${sig.ext}`;
  await env.FILES.put(key, buf, { httpMetadata: { contentType: sig.type } });
  await env.DB.prepare('INSERT INTO uploads(key,filename,content_type,size) VALUES(?,?,?,?)').bind(key, (file.name || '').slice(0, 120), sig.type, buf.length).run();
  return { key, url: '/files/' + key, size: buf.length, type: sig.type };
}
