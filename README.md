# Bookhub

Bookhub is a web platform for discovering books, audiobooks, video books and related articles, with room for category-based personalization.

## Current architecture

```text
Browser
  └─ Front-end/assets (HTML + CSS + JS)
       └─ Supabase browser client
            ├─ Supabase Auth
            └─ PostgreSQL + RLS

Server-side work
  └─ Backend / future API routes
       └─ Prisma
            └─ PostgreSQL

Deployment
  └─ Vercel
```

**Frontend:** plain HTML/CSS/JavaScript. **Data/Auth:** Supabase. **Server-side ORM:** Prisma. **Hosting:** Vercel.

Prisma is never imported into browser code. Database passwords, `DATABASE_URL`, `DIRECT_URL`, and service-role credentials must remain server-side.

## Project structure

```text
E-book/
├── Front-end/
│   └── assets/
│       ├── index.html
│       ├── categories.html
│       ├── search.html
│       ├── book.html
│       ├── profile.html
│       ├── about.html
│       ├── help.html
│       ├── css/
│       │   └── style.css
│       └── js/
│           ├── app.js
│           ├── supabase.js
│           └── supabaseClient.js   # legacy placeholder; app.js no longer imports this
├── Back-end/
│   ├── prisma/
│   │   └── schema.prisma
│   └── supabase/
│       └── schema_user_data.sql
├── vercel.json
├── .env.example
└── CONTRIBUTING_FRONTEND.md
```

## Vercel

The frontend intentionally remains under `Front-end/assets`. `vercel.json` maps clean public routes such as `/`, `/search`, `/book`, `/about`, `/help`, and `/profile` to those HTML files and maps `/css/*` and `/js/*` to their frontend asset directories.

For a Vercel project using the repository root, use **Framework Preset: Other** and no build command. Do not set the Vercel Root Directory to `Front-end/assets` unless the deployment configuration is moved there as well.

## Supabase

The E-book Supabase project currently contains `profiles`, `books`, `articles`, and `bookmarks`, all with RLS enabled. The browser client uses the project's public URL and publishable key. Those credentials are intended for browser use; database credentials and service-role keys are not.

The current `books` columns are: `id`, `title`, `author`, `description`, `category`, `format`, `cover_image_url`, `content_url`, `published_year`, and `created_at`.

The frontend now reads these real column names. The database currently has no book rows, so the home and search pages correctly show an empty state until catalog data is added.

## Frontend data flow

- `index.html` loads featured books from Supabase.
- `search.html` searches title, author and description in `books`.
- `book.html?id=<uuid>` loads one book from Supabase.
- `categories.html` stores current preferences in browser storage until authenticated profile persistence is deliberately enabled.
- `profile.html` displays those browser preferences.

## Supabase vs Prisma maintenance

Treat Supabase PostgreSQL as the source of truth for the live database schema and RLS policies.

When a schema change is needed:

1. Decide whether the change belongs to the live database.
2. Apply the SQL as a tracked Supabase migration.
3. Verify RLS/policies and test the affected queries.
4. Run `npx prisma db pull` against the same database.
5. Run `npx prisma generate`.
6. Review the generated Prisma schema before committing.

Do not independently change `schema.prisma` and the Supabase schema and assume they will remain synchronized. Prisma does not replace Supabase RLS policy management.

The current Prisma schema is aligned to the live application tables: `Profile`, `Book`, `Article`, and `Bookmark`. Supabase Auth owns `auth.users`.

## Local development

```bash
npm install
npx serve Front-end/assets
```

Or use any local static HTTP server. Opening HTML directly with `file://` is not recommended for module imports and browser API behaviour.

## Git collaboration

Before editing:

```bash
git pull --rebase origin main
git status
```

After editing:

```bash
git status
git diff
git add .
git commit -m "describe the focused change"
git push origin <your-branch>
```

Do not force-push shared branches. Prefer a feature branch and pull request for significant work.

See `CONTRIBUTING_FRONTEND.md` for the frontend collaborator workflow.
