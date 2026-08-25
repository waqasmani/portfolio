import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    // Keep the pool modest: this app runs as a long-lived Node process
    // (PM2/Docker), one pool per instance.
    max: 10,
  });
  return new PrismaClient({ adapter });
}

/** Application-wide Prisma client (singleton across dev HMR reloads). */
export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
