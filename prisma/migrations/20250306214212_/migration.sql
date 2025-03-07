/*
  Warnings:

  - A unique constraint covering the columns `[chatId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Order_chatId_key" ON "Order"("chatId");
