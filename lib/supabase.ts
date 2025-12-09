
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// NOTE: In a real production app, these should be in a .env file
// process.env.REACT_APP_SUPABASE_URL
// process.env.REACT_APP_SUPABASE_ANON_KEY

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase credentials not found or invalid. Falling back to local storage (Demo Mode).');
}

export const supabase = client;
