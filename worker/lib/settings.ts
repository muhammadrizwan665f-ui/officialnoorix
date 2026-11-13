import type { Env } from '../types';
import { bad } from './http';

export const SETTING_KEYS = [
  'site_name', 'tagline', 'logo', 'favicon', 'email', 'whatsapp', 'phone', 'address',
  'facebook', 'instagram', 'linkedin', 'x', 'youtube', 'tiktok', 'booking_url',
  'default_currency', 'seo_title', 'seo_description', 'og_image', 'footer_description', 'turnstile_site_key',
] as const;
const URL_KEYS = new Set(['logo', 'favicon', 'og_image', 'facebook', 'instagram', 'linkedin', 'x', 'youtube', 'tiktok', 'booking_url']);

export function cleanSetting(key: string, raw: unknown): string {
  if (typeof raw !== 'string') throw bad(`${key} must be text`);
  let v = raw.trim();
  if (v.length > 600) throw bad(`${key} is too long`);
  if (URL_KEYS.has(key) && v && !/^(https?:\/\/|\/)[^\s<>"']+$/.test(v)) throw bad(`${key} must be a full link starting with https://`);
  if (key === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw bad('Email address looks invalid');
  if (key === 'whatsapp') { v = v.replace(/[\s+()-]/g, ''); if (v && !/^\d{7,15}$/.test(v)) throw bad('WhatsApp number must contain 7 to 15 digits with country code, for example 923001234567'); }
  if (key === 'default_currency' && !['USD', 'PKR'].includes(v)) throw bad('Currency must be USD or PKR');
  return v;
}

export async function loadSettings(env: Env): Promise<Record<string, string>> {
  const { results } = await env.DB.prepare('SELECT key,value FROM settings').all<{ key: string; value: string }>();
  const o: Record<string, string> = {};
  for (const k of SETTING_KEYS) o[k] = '';
  for (const r of results) if ((SETTING_KEYS as readonly string[]).includes(r.key)) o[r.key] = r.value;
  return o;
}
