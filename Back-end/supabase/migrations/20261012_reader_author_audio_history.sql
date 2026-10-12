-- Bookhub reader/author follows, participant-only messages, and personal reading history.
-- Review and apply through the Supabase migration workflow; do not run blindly in production.
create table if not exists public.profile_follows(
 follower_id uuid not null references auth.users(id) on delete cascade,
 followed_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(follower_id,followed_id), constraint follows_not_self check(follower_id<>followed_id));
create index if not exists profile_follows_followed_idx on public.profile_follows(followed_id,created_at desc);
create table if not exists public.direct_messages(
 id uuid primary key default gen_random_uuid(), sender_id uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 5000), created_at timestamptz not null default now(), read_at timestamptz,
 constraint messages_not_self check(sender_id<>recipient_id));
create index if not exists direct_messages_conversation_idx on public.direct_messages(sender_id,recipient_id,created_at desc);
create table if not exists public.reading_history(
 user_id uuid not null references auth.users(id) on delete cascade, item_key text not null, title text not null,
 author text, description text, content_url text, content_type text not null default 'Book',
 last_position_seconds integer not null default 0 check(last_position_seconds>=0), last_opened_at timestamptz not null default now(),
 primary key(user_id,item_key));
create index if not exists reading_history_recent_idx on public.reading_history(user_id,last_opened_at desc);
alter table public.profile_follows enable row level security;
alter table public.direct_messages enable row level security;
alter table public.reading_history enable row level security;
drop policy if exists "Users can read follows involving themselves" on public.profile_follows;
create policy "Users can read follows involving themselves" on public.profile_follows for select to authenticated using(auth.uid()=follower_id or auth.uid()=followed_id);
drop policy if exists "Users can follow as themselves" on public.profile_follows;
create policy "Users can follow as themselves" on public.profile_follows for insert to authenticated with check(auth.uid()=follower_id and auth.uid()<>followed_id);
drop policy if exists "Users can unfollow as themselves" on public.profile_follows;
create policy "Users can unfollow as themselves" on public.profile_follows for delete to authenticated using(auth.uid()=follower_id);
drop policy if exists "Participants can read direct messages" on public.direct_messages;
create policy "Participants can read direct messages" on public.direct_messages for select to authenticated using(auth.uid()=sender_id or auth.uid()=recipient_id);
drop policy if exists "Senders can send direct messages" on public.direct_messages;
create policy "Senders can send direct messages" on public.direct_messages for insert to authenticated with check(auth.uid()=sender_id and auth.uid()<>recipient_id);
drop policy if exists "Users can manage their own reading history" on public.reading_history;
create policy "Users can manage their own reading history" on public.reading_history for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
alter table public.profiles enable row level security;
drop policy if exists "Authenticated users can discover profiles" on public.profiles;
create policy "Authenticated users can discover profiles" on public.profiles for select to authenticated using(true);
