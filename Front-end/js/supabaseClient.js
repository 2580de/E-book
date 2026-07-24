// ============================================================
// Supabase client setup
// ------------------------------------------------------------
// 1. Create a project at https://supabase.com
// 2. Copy your Project URL and anon/public key from
//    Project Settings -> API
// 3. Fill them in below (or better: load from env at build time
//    if you wire up a bundler later — see .env.example)
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';       // e.g. https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
