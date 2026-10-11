# Bookhub

Bookhub is a responsive discovery platform for books, audiobooks, video books, and articles. The application is being moved to **Next.js App Router** while preserving the existing catalogue, Supabase/Postgres data direction, and Prisma schema.

## Application architecture

```text
app/
├── layout.tsx             # global metadata and shared CSS
├── page.tsx               # account, preference onboarding, and discovery UI
└── globals.css            # responsive dark-denim design system
lib/
└── supabase.ts            # browser-safe Supabase client
Back-end/
├── prisma/schema.prisma   # Prisma representation of public application tables
└── supabase/              # SQL source for policies/functions/migrations
prisma.config.ts           # Prisma CLI configuration
next.config.ts             # Next.js configuration
.env.example               # environment variable names only
```

### Data ownership

- **GitHub** stores source code and history.
- **Vercel** builds and hosts the Next.js application.
- **Supabase Auth** owns identities and sessions.
- **Supabase PostgreSQL** is the source of truth for account-owned profiles, catalogue records, and future cross-device library data.
- **Prisma** is the server-side ORM for PostgreSQL; it is not a second database. Do not import database credentials or server Prisma code into browser components.
- The current sample catalogue and saved-title preview are demo data. Saved titles currently use browser local storage; account-synced bookmarks and reading progress require dedicated tables and verified Row Level Security policies.

## Local development with Termux

Install Node.js 22 or later and Git in Termux, then clone the repository and switch to the feature branch:

```bash
pkg update && pkg upgrade -y
pkg install git nodejs-lts -y
gh auth login
gh repo clone 2580de/E-book
cd E-book
git switch feat/nextjs-bookhub-foundation
npm install
cp .env.example .env.local
npm run dev
```

Open the local address printed by Next.js. In Acode, open the same `E-book` folder; edits saved in Acode are visible to Git in Termux because both operate on the same directory. Do not keep a second independent copy of the project if you expect changes to synchronize.

If you prefer Ubuntu through proot, use `proot-distro login ubuntu --shared-home`; the shared Termux home is available inside Ubuntu. Install a compatible Node.js 22+ release there before running `npm install`.

## Environment configuration

Set these values in `.env.local` for local development and in Vercel project environment settings for Preview/Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key only)

The Prisma CLI may also require server-only `DATABASE_URL` and `DIRECT_URL`. Never place database passwords, service-role keys, or other secrets in variables prefixed with `NEXT_PUBLIC_`, source control, screenshots, or chat messages.

Enable Email authentication in Supabase. To enable Google sign-in, configure the Google provider in Supabase Auth and add the correct deployed origin/callback URLs to Supabase and Google Cloud.

## Database safety and next implementation steps

Before enabling persistent user data in production, audit the live Supabase tables and policies. In particular, verify that each user can read/write only their own profile, and that bookmarks, progress, uploads, and activity tables have explicit access policies. Do not run schema migrations against production until the current schema and migration history have been reviewed.

Recommended implementation sequence:
1. Review current Supabase schema, RLS policies, and Vercel project settings.
2. Finish and verify Next.js build in a preview deployment.
3. Confirm authentication, email confirmation, and Google OAuth redirect settings.
4. Persist preferences through `profiles` after verifying its schema and policies.
5. Add account-owned bookmarks and reading progress with RLS.
6. Add book submission/moderation, storage policies, and licensed media providers.
7. Test account isolation, reload persistence, mobile layout, and production logs.

## Sample catalogue disclaimer

The included catalogue entries and CSS-generated covers are illustrative. This app does not stream licensed full books, audio, or video unless a content provider and the corresponding rights are connected.