
import { createClient } from '@supabase/supabase-js';

// Menggunakan environment variables untuk keamanan
// Di lingkungan lokal, pastikan variabel ini ada di file .env
const supabaseUrl = process.env.SUPABASE_URL || 'https://eecvxisnyyabwbfajtxk.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_NY-20ztH0XVk6y_-gybnHw_xMeEJpC5';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to get current session and user profile
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, class:classes(name), semester:semesters(name)')
    .eq('id', user.id)
    .single();

  return profile; 
};
