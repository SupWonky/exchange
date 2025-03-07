-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PricingTierOption" (
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stringValue" TEXT,
    "booleanValue" BOOLEAN,
    "pricingTierId" TEXT NOT NULL,
    CONSTRAINT "PricingTierOption_pricingTierId_fkey" FOREIGN KEY ("pricingTierId") REFERENCES "PricingTier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PricingTierOption" ("booleanValue", "name", "pricingTierId", "stringValue", "type") SELECT "booleanValue", "name", "pricingTierId", "stringValue", "type" FROM "PricingTierOption";
DROP TABLE "PricingTierOption";
ALTER TABLE "new_PricingTierOption" RENAME TO "PricingTierOption";
CREATE UNIQUE INDEX "PricingTierOption_name_pricingTierId_key" ON "PricingTierOption"("name", "pricingTierId");
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "averageRating" REAL NOT NULL DEFAULT 0.0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "Service_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("averageRating", "categoryId", "createdAt", "deletedAt", "description", "id", "slug", "status", "title", "totalReviews", "updatedAt", "userId") SELECT "averageRating", "categoryId", "createdAt", "deletedAt", "description", "id", "slug", "status", "title", "totalReviews", "updatedAt", "userId" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
