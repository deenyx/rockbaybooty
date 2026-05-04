import { PrismaClient } from '@prisma/client'

// In development, hot-module reloads would otherwise leak a new PrismaClient
// instance on every reload. The globalThis singleton prevents that.
// In production there is one process and one long-lived client.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
