# Bookhub

Bookhub is a responsive discovery platform for books, audiobooks, video books and articles, with personalized interests and synchronized user state.

## V2 architecture

```text
Front-end/assets/
├── index.html, categories.html, search.html, book.html, library.html
├── login.html, create-account.html
├── css/                         # shared responsive design system
└── js/
    ├── supabaseClient.js        # browser-safe Supabase client
    ├── auth.js                  # sign-in and account creation
    ├── app.js                   # profile, catalogue queries, realtime layer
    └── catalog.js               # local demo catalogue and local-first shelf

Back-end/
├── db/client.ts                 # Prisma 7 + pg adapter, server-only runtime
├── prisma/schema.prisma         # Prisma representation of public tables
└── supabase/migrations/         # Supabase-specific SQL, RLS and triggers

prisma.config.ts                 # Prisma CLI uses DIRECT_URL
vite.config.js                   # Vite multi-page build
vercel.json                      # Vercel clean routes
.env.example                     # safe environment template
```

## Data flow and security boundaries

1. **Browser authentication and reads:** Vite injects only `VITE_SUPABASE_URL` and the Supabase publishable key. Supabase Auth manages sessions; PostgREST accesses public tables under Row Level Security.
2. **User-owned data:** `profiles`, `bookmarks`, and `user_activity` must use RLS policies that bind rows to `auth.uid()`. A database trigger creates a profile after a new Auth user is created.
3. **Server-side ORM:** Prisma connects to the same Supabase PostgreSQL database through `Back-end/db/client.ts`. Never import the Prisma client into browser modules and never expose database URLs or passwords with a `VITE_` prefix.
4. **Local-first shelf:** the current catalogue's saved items, recent views and progress still use localStorage. Cross-device bookmark/progress sync requires explicit UI integration with the existing `bookmarks` table and additional progress storage.

Supabase remains the source of truth; Prisma is an ORM, not a second database.

## Environment configuration

Copy `.env.example` to `.env.local`. Fill in the publishable key from Supabase **Project Settings → API Keys**. The publishable key is designed for browser use, but RLS is still mandatory. Never use a secret/service-role key in frontend variables.

The connection values for this project use the Supavisor pooler:

- `DATABASE_URL`: transaction-mode pooler, port `6543`, for server runtime.
- `DIRECT_URL`: session-mode pooler, port `5432`, for Prisma CLI introspection and migrations.
- URL-encode special characters in the database password (for example, `$` becomes `%24`).
- Keep both database URLs only in local server environment and Vercel server-side environment if/when a server function uses Prisma. This static frontend does not currently call Prisma directly.

**Credential safety:** if a database password has been pasted into a chat, issue a new database password in Supabase and update local/Vercel environment values. Never commit it to GitHub.

## Prisma 7 commands

Node.js 22 or newer is required by this repository.

```bash
npm install
npm run db:pull
npm run db:generate
npm run db:validate
npm run build
```

Prisma 7 uses the `prisma-client` generator with a custom output path and a PostgreSQL driver adapter. Keep this configuration; do not replace it with the older `prisma-client-js` generator without migrating the project intentionally.

Before applying a SQL file in `Back-end/supabase/migrations/`, review it against the live schema and existing RLS policies. The migration file is a source-of-truth change proposal; committing it does not execute it in Supabase.

## Local development and deployment

```bash
npm run dev
npm run build
npm run preview
```

Vite serves `Front-end/assets` and writes production files to `dist/`. The build includes the sign-in and account-creation pages. Vercel should build with `npm run build` and use `dist` as the output directory.

Set these Vercel environment variables for Production and Preview as needed:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Only add `DATABASE_URL` and `DIRECT_URL` if a server-side deployment function actually uses Prisma. Never add database secrets as `VITE_*` variables.

## Live database schema notes

The connected Supabase project currently contains `profiles`, `books`, `articles`, and `bookmarks`. The frontend profile preferences expect `selected_categories` and `selected_formats`; the SQL migration adds these fields and creates the `user_activity` table used by the application layer. Review the migration and policies before applying it to the live project.

The current local demo catalogue is not yet the same thing as the live catalogue: saved titles, recent views, and reading progress remain browser-local. The detail page does not claim to stream licensed books, audio or video.

## Quality targets

- Responsive layouts from 320px upward.
- Shared CSS tokens and keyboard-visible focus.
- Reduced-motion support and accessible status messages.
- No database credentials in browser bundles.
- RLS for authenticated user-owned records.
- Prisma schema validation and regeneration after database changes.
