// INMOSEARCH — Cliente Prisma (singleton para evitar múltiples conexiones en dev)
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import zlib from "node:zlib";
import { EMBEDDED_DB_GZIP_BASE64 } from "./embedded-seed";

/** Resuelve la URL de la base de datos.
 * - Si DATABASE_URL está definida, se usa tal cual (p.ej. Postgres en prod).
 * - Sin ella: en serverless (Vercel) usa un SQLite en /tmp (escribible);
 *   en local, el dev.db habitual. */
function resolveDatabaseUrl(): string {
  const explicit = process.env.DATABASE_URL;
  if (explicit) return explicit;
  return process.env.VERCEL ? "file:/tmp/inmosearch.db" : "file:./dev.db";
}

const url = resolveDatabaseUrl();

// Demo sin base de datos externa: si apuntamos a un SQLite en /tmp que no existe
// y hay una semilla embebida, la volcamos (datos efímeros por instancia).
if (url.startsWith("file:/tmp") && EMBEDDED_DB_GZIP_BASE64) {
  const filePath = url.replace(/^file:/, "");
  try {
    if (!fs.existsSync(filePath)) {
      const gz = Buffer.from(EMBEDDED_DB_GZIP_BASE64, "base64");
      fs.writeFileSync(filePath, zlib.gunzipSync(gz));
    }
  } catch (e) {
    console.error("[db] no se pudo sembrar la base de datos en /tmp:", e);
  }
}

process.env.DATABASE_URL = url;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
