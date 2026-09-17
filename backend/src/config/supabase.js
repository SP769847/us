import { createClient } from '@supabase/supabase-js';

// Optional: only used when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set
// (see .env.example). Without them, uploads fall back to local disk — fine
// for local dev, but local disk does NOT survive a redeploy/restart on
// Render, so production should always have these set (see utils/upload.js).
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

export function isSupabaseStorageConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

// The service role key bypasses Row Level Security — appropriate here since
// the backend is the trusted party uploading on an already-authenticated
// user's behalf (the same trust boundary as writing to the database directly).
let client = null;
export function getSupabase() {
  if (!isSupabaseStorageConfigured()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
  return client;
}
