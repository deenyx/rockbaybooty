import type { Prisma } from '@prisma/client'

const ACCOUNT_NAME_SEQUENCE_LOCK_ID = 76432011

export async function generateNextAccountName(tx: Prisma.TransactionClient): Promise<string> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ACCOUNT_NAME_SEQUENCE_LOCK_ID})`

  const result = await tx.$queryRaw<Array<{ maxSeq: number }>>`
    SELECT COALESCE(
      MAX(
        CASE
          WHEN "accountName" ~ '^#[0-9]+$' THEN CAST(SUBSTRING("accountName" FROM 2) AS INTEGER)
          ELSE NULL
        END
      ),
      0
    )::int AS "maxSeq"
    FROM "User"
  `

  const currentMax = result[0]?.maxSeq ?? 0
  return `#${currentMax + 1}`
}
