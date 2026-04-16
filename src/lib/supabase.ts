const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ykrxuyvixnoiwutwibpf.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
