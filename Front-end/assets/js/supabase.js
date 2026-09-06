// Bookhub browser Supabase client.
// The URL and publishable key are intentionally public browser credentials.
// NEVER put a service_role key, database password, DATABASE_URL, or DIRECT_URL here.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://esuoeumgwafsmylkcqdy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_L6xVWi7dIYW-ghIXwgEpsw_2dng9QXl';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
