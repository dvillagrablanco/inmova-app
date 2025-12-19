/**
 * Re-export Prisma client from db.ts for compatibility
 * This allows imports from both @/lib/prisma and @/lib/db
 */
export { prisma, db } from './db';
export { default } from './db';
