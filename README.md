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
