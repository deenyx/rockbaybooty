-- Add immutable registry account name for each user
ALTER TABLE "User" ADD COLUMN "accountName" TEXT;

-- Backfill existing users with sequential account names in creation order
WITH ordered_users AS (
  SELECT "id", row_number() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS seq
  FROM "User"
)
UPDATE "User" u
SET "accountName" = '#' || ordered_users.seq::text
FROM ordered_users
WHERE u."id" = ordered_users."id";

ALTER TABLE "User" ALTER COLUMN "accountName" SET NOT NULL;

CREATE UNIQUE INDEX "User_accountName_key" ON "User"("accountName");
