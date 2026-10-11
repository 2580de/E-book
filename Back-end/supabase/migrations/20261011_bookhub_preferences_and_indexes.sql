-- Bookhub Next.js onboarding compatibility and bookmark query indexes.
-- Review and apply through a reviewed migration process; do not run blindly on production.
alter table public.profiles
  add column if not exists selected_categories text[] not null default '{}',
  add column if not exists selected_formats text[] not null default '{}';

create index if not exists bookmarks_user_id_idx on public.bookmarks (user_id);
create index if not exists bookmarks_book_id_idx on public.bookmarks (book_id);
create index if not exists bookmarks_article_id_idx on public.bookmarks (article_id);

-- rls_auto_enable is an event-trigger function intended for DDL event triggers,
-- not an exposed client RPC. Restrict API roles; keep owner/service administration.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
