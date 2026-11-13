import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured =
  Boolean(url && anonKey) && !String(url).includes('YOUR-PROJECT-REF');

// When the environment variables are missing the site still renders and
// shows a setup notice instead of crashing.
export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export const PHOTO_BUCKET = 'provider-photos';

export function photoUrl(path) {
  if (!path || !supabase) return null;
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}
