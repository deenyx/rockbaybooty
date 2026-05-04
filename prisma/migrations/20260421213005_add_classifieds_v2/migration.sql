/*
  Warnings:

  - Added the required column `expiresAt` to the `Classified` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Classified` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Classified" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Classified_userId_idx" ON "Classified"("userId");

-- CreateIndex
CREATE INDEX "Classified_category_status_idx" ON "Classified"("category", "status");

-- CreateIndex
CREATE INDEX "Classified_status_expiresAt_idx" ON "Classified"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "Classified" ADD CONSTRAINT "Classified_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
