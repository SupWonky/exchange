/*
  Warnings:

  - A unique constraint covering the columns `[variant,serviceId]` on the table `PricingTier` will be added. If there are existing duplicate values, this will fail.

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

    PRIMARY KEY ("name", "pricingTierId"),
    CONSTRAINT "PricingTierOption_pricingTierId_fkey" FOREIGN KEY ("pricingTierId") REFERENCES "PricingTier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PricingTierOption" ("booleanValue", "name", "pricingTierId", "stringValue", "type") SELECT "booleanValue", "name", "pricingTierId", "stringValue", "type" FROM "PricingTierOption";
DROP TABLE "PricingTierOption";
ALTER TABLE "new_PricingTierOption" RENAME TO "PricingTierOption";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PricingTier_variant_serviceId_key" ON "PricingTier"("variant", "serviceId");
