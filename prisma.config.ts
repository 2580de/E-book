import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 reads its CLI connection URL from this file.
// DIRECT_URL is the Supavisor session-mode pooler (port 5432).
// The runtime adapter in Back-end/db/client.ts uses DATABASE_URL.
export default defineConfig({
  schema: 'Back-end/prisma/schema.prisma',
  migrations: {
    path: 'Back-end/prisma/migrations',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
});
