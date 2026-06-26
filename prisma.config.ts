import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local (Next.js convention) then fall back to .env
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Direct non-pooled connection required for schema migrations
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
