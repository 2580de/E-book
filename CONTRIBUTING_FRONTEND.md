# Frontend collaborator guide

This guide is for anyone working on the Bookhub frontend.

## Your workspace

Work primarily inside `Front-end/assets/`:

- HTML pages: `*.html`
- Shared CSS: `css/style.css`
- Browser logic: `js/app.js`
- Browser Supabase client: `js/supabase.js`

Do not put database passwords, `DATABASE_URL`, `DIRECT_URL`, Supabase service-role keys, or other privileged credentials in this folder.

## What each layer does

| Layer | Responsibility |
|---|---|
| HTML | Page structure and accessible content |
| CSS | Layout, typography, responsive design |
| Browser JS | Events, rendering and public Supabase queries |
| Supabase | Auth, PostgreSQL, RLS and application data |
| Prisma | Server-side database access and schema representation |
| Vercel | Deployment and public routing |

## Adding a page

1. Add the HTML file to `Front-end/assets/`.
2. Reuse `css/style.css` and the existing navigation.
3. Import shared browser helpers from `js/app.js` when needed.
4. Use `js/supabase.js` only for browser-safe Supabase access.
5. Add the public route to `vercel.json` when a clean URL is needed.
6. Test with a local HTTP server.

## Database changes

Do not invent column names in frontend code. Check the current Supabase schema first.

If a feature requires a new table, column, relationship or RLS policy:

1. Coordinate with the project owner.
2. Make the database change as a tracked Supabase migration.
3. Test RLS and queries.
4. Run `npx prisma db pull` and `npx prisma generate` from the server-side environment.
5. Review the resulting `Back-end/prisma/schema.prisma` change.
6. Commit the database/schema work together with the affected application code when appropriate.

## Git workflow with Acode + Termux

Acode is the editor. Termux is the Git command line. GitHub is the shared source of truth.

Start each session with:

```bash
git fetch origin
git status
git pull --rebase origin main
```

Then edit in Acode. After saving:

```bash
git status
git diff
```

Create a focused commit and push your branch:

```bash
git add Front-end/assets
 git commit -m "feat: describe frontend change"
git push -u origin <your-branch>
```

Do not use `git push --force` on shared branches.

## Before handing off work

Confirm:

- links work
- no console errors occur
- mobile layout still works
- Supabase requests use real column names
- no privileged secrets are present
- `git diff` contains only intended changes
- the branch is pushed to GitHub

## Background/server-side model

The browser should not connect directly to Prisma. A future server/API layer can receive an authenticated request, validate it, perform privileged operations through Prisma, and return safe data to the frontend.

That keeps the browser lightweight while keeping database credentials and privileged operations off the client.
