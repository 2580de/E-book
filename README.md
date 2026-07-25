# Bookhub

A web platform for discovering books, audiobooks, video books, and related news/articles — with category-based personalization.

## Stack
- **Frontend:** plain HTML / CSS / JS (no build step yet)
- **Hosting:** Vercel (auto-deploys from `main`, PR previews for review)
- **Backend:** Supabase (Auth + Postgres)

## Project structure
```
bookhub/
├── index.html          # home page
├── categories.html     # interest/category selection
├── search.html         # search + filters
├── css/style.css        # shared design tokens & styles
├── js/
│   ├── supabaseClient.js   # Supabase connection (fill in your keys)
│   └── app.js              # data functions (search, save interests, featured books)
├── vercel.json          # clean URL routing for Vercel
└── .env.example         # documents required Supabase keys
```

## Getting started (local)
No build step needed — just open `index.html` in a browser, or run a local server:
```bash
npx serve .
```

## Connecting Supabase
1. Create a project at https://supabase.com
2. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**
3. Open `js/supabaseClient.js` and replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY`
4. Never commit real keys to a public repo — if this repo is public, ask about switching to a bundler (Vite) so keys can be loaded from `.env.local` instead.

### Suggested tables
```sql
-- profiles: one row per user, links to Supabase Auth
create table profiles (
  id uuid references auth.users primary key,
  selected_categories text[],
  selected_formats text[]
);

-- books: the core catalog
create table books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text,
  category text,
  format text,       -- 'book' | 'audio' | 'video'
  cover_url text,
  blurb text
);

-- articles: news, interviews, ads
create table articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  kind text,          -- 'news' | 'interview' | 'sponsored'
  published_at timestamptz default now(),
  url text
);
```
Enable Row Level Security on `profiles` so users can only read/write their own row.

## Deploying to Vercel
1. Push this repo to GitHub (already done)
2. In Vercel: **Add New → Project → Import** this repo
3. Framework preset: **Other** (static site, no build command needed)
4. Every push to `main` deploys to production; every PR gets its own preview URL

## Pages built so far
- `index.html` — home / discovery feed
- `categories.html` — user interest & format selection
- `search.html` — search with filters across books, audiobooks, video books, articles

## Next up
- Book detail page
- Audiobook / video player page
- Auth (sign up / log in) wired to Supabase
- Dedicated news & ads page

## ORM (Prisma) — server-side only

Prisma sits alongside the static pages for anything server-side: migrations, seed scripts, or a future API route. It is **not** used by the browser pages directly (those keep using `js/supabaseClient.js`).

Files already in the repo:
- `prisma/schema.prisma` — models mapped to every table in `supabase/schema_user_data.sql` plus `profiles`/`books`/`articles`
- `.env.example` — includes `DATABASE_URL` (pooled, for runtime) and `DIRECT_URL` (direct, for migrations)

### Finish the setup locally
```bash
npm install prisma --save-dev
npx prisma init   # only if starting fresh — schema.prisma is already provided here
```
1. Copy `.env.example` to `.env.local`, fill in your Supabase project ref and DB password (**Project Settings → Database → Connection string**)
2. Since the tables already exist (created via `supabase/schema_user_data.sql`), pull them into Prisma instead of migrating:
   ```bash
   npx prisma db pull      # confirms schema.prisma matches the live DB
   npx prisma generate     # generates the Prisma Client
   ```
3. Going forward, prefer editing SQL directly in Supabase (keeps RLS policies visible/manageable there) and running `prisma db pull` to resync `schema.prisma`, rather than using `prisma migrate` — Prisma migrations don't manage RLS policies.

### Optional: Agent Skills for Supabase
```bash
npx skills add supabase/agent-skills
```
Gives AI coding tools (like Claude Code) ready-made context for working with this Supabase project more accurately.
