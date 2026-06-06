import "dotenv/config";
import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

let dbUrl = process.env.DATABASE_URL || "";
if (dbUrl) {
  // Replace '-pooler' to use Neon's direct connection for migrations, which supports advisory locks
  dbUrl = dbUrl.replace("-pooler", "");
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