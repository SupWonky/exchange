/*
  Warnings:

  - The primary key for the `PricingTierOption` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PricingTierOption" (
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stringValue" TEXT,
    "booleanValue" BOOLEAN,
    "pricingTierId" TEXT NOT NULL,
    CONSTRAINT "PricingTierOption_pricingTierId_fkey" FOREIGN KEY ("pricingTierId") REFERENCES "PricingTier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PricingTierOption" ("booleanValue", "name", "pricingTierId", "stringValue", "type") SELECT "booleanValue", "name", "pricingTierId", "stringValue", "type" FROM "PricingTierOption";
DROP TABLE "PricingTierOption";
ALTER TABLE "new_PricingTierOption" RENAME TO "PricingTierOption";
CREATE UNIQUE INDEX "PricingTierOption_name_pricingTierId_key" ON "PricingTierOption"("name", "pricingTierId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
