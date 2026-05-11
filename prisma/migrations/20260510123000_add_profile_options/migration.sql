CREATE TABLE "ProfileOption" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProfileOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfileOption_category_value_key" ON "ProfileOption"("category", "value");
CREATE INDEX "ProfileOption_category_isActive_sortOrder_idx" ON "ProfileOption"("category", "isActive", "sortOrder");
