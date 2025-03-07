/*
  Warnings:

  - A unique constraint covering the columns `[buyerId,sellerId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Order_buyerId_sellerId_key" ON "Order"("buyerId", "sellerId");
