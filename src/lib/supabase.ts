import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};

const rawUrl = (metaEnv.VITE_SUPABASE_URL || '').trim();
const rawKey = (metaEnv.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  rawUrl && 
  rawKey &&
  !rawUrl.includes('your-supabase-project-ref') &&
  rawUrl.startsWith('https://')
);

const supabaseUrl = isSupabaseConfigured ? rawUrl.replace(/\/+$/, '') : 'https://placeholder-project.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

