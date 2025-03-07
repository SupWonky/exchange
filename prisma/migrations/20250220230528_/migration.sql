-- CreateTable
CREATE TABLE "PricingTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variant" TEXT NOT NULL DEFAULT 'BASIC',
    "price" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "volume" INTEGER NOT NULL,
    "serviceId" TEXT NOT NULL,
    CONSTRAINT "PricingTier_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
