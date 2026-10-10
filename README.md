# Bookhub

Bookhub is a responsive discovery platform for books, audiobooks, video books and articles, with personalized interests and synchronized user state.

## V2 architecture

```text
Front-end/assets/
├── index.html
├── categories.html
├── search.html
├── css/
│   └── style.css                 # shared fluid design system
└── js/
    ├── main.js                   # one UI bootstrap entry
    ├── ui.js                     # navigation, reveal, busy states, a11y helpers
    ├── sync.js                   # localStorage + cross-tab UI synchronization
    ├── supabaseClient.js         # browser-safe Supabase client
    └── app.js                    # data/auth/realtime application layer

Back-end/
├── db/client.ts                  # Prisma 7 + pg adapter, pooled runtime connection
└── prisma/
    └── schema.prisma             # canonical Prisma representation of public tables

prisma.config.ts                  # Prisma CLI uses DIRECT_URL
vite.config.js                    # Vite root/build configuration
vercel.json                       # Vercel routing
.env.example                      # browser-safe + server-only variables
```

## Synchronization model

There are three layers, intentionally separated:

1. **UI state:** `sync.js` persists non-sensitive preferences locally and synchronizes changes between browser tabs with the `storage` event.
2. **Cloud user state:** `app.js` uses Supabase Auth + Postgres and subscribes to `profiles` through Supabase Realtime, so profile changes can update an open client without a reload.
3. **Server data access:** Prisma is server-side only. The browser never receives `DATABASE_URL` or `DIRECT_URL`.

Supabase remains the source of truth for authenticated user data. Prisma is the type-safe server ORM over the same Supabase PostgreSQL database; it does not create a second database.

## Prisma 7 + Supabase PostgreSQL

Prisma ORM 7 uses the `prisma-client` generator and requires a custom generated output path. It also requires a driver adapter for direct relational database connections. This repository uses `@prisma/adapter-pg` and `pg`. See the official Prisma v7 documentation for the generator and adapter model.

The connection split is deliberate:

- `DATABASE_URL` = Supabase transaction pooler / Supavisor connection for the application runtime.
- `DIRECT_URL` = direct database connection for Prisma CLI introspection and schema operations.

The browser only receives `VITE_SUPABASE_URL` and the public/anon key. Never prefix database passwords or service-role secrets with `VITE_`.

### Sync an existing Supabase schema into Prisma

```bash
npm install
npm run db:pull
npm run db:generate
npm run db:validate
```

After changing the database schema in Supabase, run `npm run db:sync` to pull the live PostgreSQL schema and regenerate Prisma Client.

## Frontend development

```bash
npm install
npm run dev
```

Vite serves `Front-end/assets` as the project root. The output is written to `dist/` for deployment.

Create `.env.local` from `.env.example` and set the two `VITE_SUPABASE_*` values. Keep `DATABASE_URL` and `DIRECT_URL` server-side.

## Database ownership

Supabase Auth owns `auth.users`. Application tables live in `public` and are protected with Row Level Security where user-owned data is exposed to the browser. Prisma models the application tables but does not attempt to manage `auth.users`.

For changes involving RLS policies, functions, extensions or other Supabase-specific SQL, update the SQL source in `Back-end/supabase/` and then introspect with Prisma. This avoids hiding PostgreSQL/Supabase security behavior inside ORM-only definitions.

## Quality targets

- Fluid layouts from 320px upward.
- Shared CSS tokens and reusable UI primitives instead of page-specific styling duplication.
- Reduced-motion support and visible keyboard focus.
- Responsive navigation without a framework dependency.
- Realtime profile synchronization plus cross-tab local-state synchronization.
- Pooled PostgreSQL connections for server runtime.
- Prisma schema validation and regeneration after database changes.
- No database credentials in browser bundles.

## Deployment

Vercel can build the Vite application with `npm run build` and serve `dist/`. Configure the `VITE_SUPABASE_*` variables in the Vercel project. Configure database credentials only where server-side Prisma code actually runs.


## Bookhub discovery flow (current front-end)

The static Vite front end now includes a complete discovery loop that shares the existing deep-ink, gold and moss design system:

- `index.html`: home discovery page and featured recommendations.
- `categories.html`: category and preferred-format selection, saved to local UI state.
- `search.html`: live title/author/topic search, content-type and category filters, length filters, sorting, and save actions.
- `book.html?id=<catalogue-id>`: reusable title detail view, sample/availability note, save action, and local reading-progress slider.
- `library.html`: saved items, recent views and reading progress from the current browser's local storage.
- `css/style.css`: shared responsive tokens and components; page additions continue to use the shared variables rather than introducing a second theme.
- `js/catalog.js`, `js/search.js`, `js/book.js`, `js/library.js`: catalogue data and front-end interactions.

### Local-first behavior and current limits

The front-end catalogue is sample/demo data so the navigation and personal shelf work before a live content catalogue is connected. Saved titles, recent views, and progress are stored in browser local storage; they are not account-synced and do not automatically transfer between devices. The detail page does not claim to stream licensed books, audio or video. Real catalogue data and authenticated cross-device state require configured Supabase tables, policies and application integration.

The existing Supabase + PostgreSQL + Prisma architecture remains the intended cloud data path. Keep browser-safe `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` separate from server-only `DATABASE_URL` and `DIRECT_URL`; never expose service-role keys or database credentials in the front end.

## First-run account and rose-glass UI

The root route opens the account-first welcome page in `Front-end/assets/index.html`. Users can sign in with email/password, create an account, or continue with Google. The former discovery homepage is now `Front-end/assets/discover.html`; sample book, audiobook, and video-book covers link to their detail pages.

### Authentication setup

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel's project environment variables (and in `.env.local` for local development).
2. In Supabase Authentication, enable Email and configure email confirmation to match your desired onboarding flow.
3. To enable the Google button, configure the Google provider in Supabase Authentication with the Google OAuth client credentials.
4. Add your deployed Bookhub origin and the Supabase Auth callback URL to the allowed redirect URLs in Supabase and Google Cloud. Bookhub returns to `/discover.html` after successful OAuth.
5. Redeploy after changing environment variables.

If Supabase is not configured, the welcome screen explains the missing configuration and the sample catalogue remains available through the guest browse link. The book and audiobook cards are illustrative sample catalogue entries; the detail page does not stream licensed content until a content provider is connected.
