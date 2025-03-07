-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PricingTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variant" TEXT NOT NULL DEFAULT 'BASIC',
    "price" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "volume" TEXT NOT NULL,
    "description" TEXT,
    "serviceId" TEXT NOT NULL,
    CONSTRAINT "PricingTier_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PricingTier" ("description", "duration", "id", "price", "serviceId", "volume") SELECT "description", "duration", "id", "price", "serviceId", "volume" FROM "PricingTier";
DROP TABLE "PricingTier";
ALTER TABLE "new_PricingTier" RENAME TO "PricingTier";
CREATE UNIQUE INDEX "PricingTier_variant_serviceId_key" ON "PricingTier"("variant", "serviceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
