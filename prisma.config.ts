import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'Back-end/prisma/schema.prisma',
  migrations: {
    path: 'Back-end/prisma/migrations',
  },
  datasource: {
    // Generation and validation do not connect to the database. A real URL is
    // required only for database operations; this fallback is never a secret.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/postgres',
  },
});
