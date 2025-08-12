import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing from environment variables");
}

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);