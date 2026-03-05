import { execSync } from "node:child_process";

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config();

function transformStatement(statement: string) {
  return statement
    .replace(/^CREATE TABLE /i, "CREATE TABLE IF NOT EXISTS ")
    .replace(/^CREATE INDEX /i, "CREATE INDEX IF NOT EXISTS ");
}

async function main() {
  const diffSql = execSync(
    "pnpm prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  const statements = diffSql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map(transformStatement);

  const prisma = new PrismaClient();

  try {
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(`${statement};`);
    }
  } finally {
    await prisma.$disconnect();
  }

  execSync("pnpm prisma generate", { stdio: "inherit" });
  console.log("Database schema synchronized.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
