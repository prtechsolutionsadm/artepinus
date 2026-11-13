import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Mesmo fallback do app (src/lib/adaptador.ts): a integração da Vercel também cria POSTGRES_URL
    url: process.env["DATABASE_URL"] ?? process.env["POSTGRES_URL"],
  },
});
