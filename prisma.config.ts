import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 keeps the datasource connection URL in this config file.
// DIRECT_URL should be the Supabase session-mode pooler connection used
// for introspection and migrations. Runtime code uses DATABASE_URL.
export default defineConfig({
  schema: 'Back-end/prisma/schema.prisma',
  migrations: {
    path: 'Back-end/prisma/migrations',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
});
