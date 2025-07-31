import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseKey = 'your-anon-key'; // from Supabase > Project Settings > API

export const supabase = createClient(supabaseUrl, supabaseKey);
