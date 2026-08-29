import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jwkkwrteiizikpqapiby.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JmkxKwQd3dCd3fESRWiRcw_K9L4papx';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
