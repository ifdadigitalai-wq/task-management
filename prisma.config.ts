import "dotenv/config";
import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

let dbUrl = process.env.DATABASE_URL || "";
if (dbUrl && !dbUrl.includes("pgbouncer=true")) {
  dbUrl = dbUrl.includes("?") ? `${dbUrl}&pgbouncer=true` : `${dbUrl}?pgbouncer=true`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx dotenvx run -f .env.local -- npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    url: dbUrl,
  },
});