-- ============================================================
-- Bookhub — user tracking, cache, activity & flexible data
-- Run after the core schema in README.md (profiles, books, articles)
-- ============================================================

-- ------------------------------------------------------------
-- 1. user_sessions
-- Tracks device/session info and cookie consent — NOT raw cookie
-- values (those stay in the browser). Useful for "logged in on
-- 3 devices", consent audit trail, and basic fraud/abuse checks.
-- ------------------------------------------------------------
create table user_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  session_token text unique,           -- opaque token stored in the browser cookie
  device_label text,                   -- e.g. "Chrome on Mac", filled from user-agent
  ip_address inet,
  cookie_consent jsonb default '{}',   -- e.g. {"analytics": true, "marketing": false}
  created_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  expires_at timestamptz
);

create index idx_user_sessions_user on user_sessions(user_id);
create index idx_user_sessions_token on user_sessions(session_token);


-- ------------------------------------------------------------
-- 2. user_cache
-- Generic key -> value cache per user. Self-expiring so it stays
-- small. Good for "last filters used", "in-progress search",
-- "resume playback position", etc.
-- ------------------------------------------------------------
create table user_cache (
  user_id uuid references auth.users on delete cascade,
  cache_key text not null,
  cache_value jsonb not null,
  updated_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 days'),
  primary key (user_id, cache_key)
);

create index idx_user_cache_expiry on user_cache(expires_at);


-- ------------------------------------------------------------
-- 3. user_activity
-- Append-only event log. One row per action. Powers "recently
-- viewed", recommendations, and basic usage analytics.
-- ------------------------------------------------------------
create table user_activity (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  activity_type text not null,          -- 'search' | 'view' | 'play' | 'save' | 'select_category' ...
  target_type text,                     -- 'book' | 'article' | 'category' | null
  target_id uuid,                       -- references books.id / articles.id when relevant
  metadata jsonb default '{}',          -- e.g. {"query": "ferreira"} or {"progress_seconds": 340}
  created_at timestamptz default now()
);

create index idx_user_activity_user on user_activity(user_id, created_at desc);
create index idx_user_activity_type on user_activity(activity_type);


-- ------------------------------------------------------------
-- 4. user_data
-- Flexible per-user key/value bucket for anything not worth a
-- dedicated column yet (draft settings, feature flags, onboarding
-- state). Safe to read/write from the client via RLS below.
-- ------------------------------------------------------------
create table user_data (
  user_id uuid references auth.users on delete cascade,
  data_key text not null,
  data_value jsonb not null,
  updated_at timestamptz default now(),
  primary key (user_id, data_key)
);


-- ============================================================
-- Row Level Security — users can only touch their own rows
-- ============================================================
alter table user_sessions enable row level security;
alter table user_cache    enable row level security;
alter table user_activity enable row level security;
alter table user_data     enable row level security;

create policy "own sessions" on user_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own cache" on user_cache
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own activity" on user_activity
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own data" on user_data
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ============================================================
-- Housekeeping: auto-clear expired cache rows
-- Run manually, via a cron extension, or a Supabase scheduled
-- Edge Function — pick one, don't need both.
-- ============================================================
create or replace function clean_expired_cache()
returns void as $$
  delete from user_cache where expires_at < now();
$$ language sql;
