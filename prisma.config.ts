import "dotenv/config";
import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx dotenvx run -f .env.local -- npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});