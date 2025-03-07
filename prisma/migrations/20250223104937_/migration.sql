-- CreateTable
CREATE TABLE "PricingTierOption" (
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stringValue" TEXT,
    "booleanValue" BOOLEAN,
    "pricingTierId" TEXT NOT NULL,
    CONSTRAINT "PricingTierOption_pricingTierId_fkey" FOREIGN KEY ("pricingTierId") REFERENCES "PricingTier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingTierOption_name_pricingTierId_key" ON "PricingTierOption"("name", "pricingTierId");
