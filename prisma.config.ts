import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'Back-end/prisma/schema.prisma',
  migrations: {
    path: 'Back-end/prisma/migrations',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
});
