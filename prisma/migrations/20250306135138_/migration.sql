-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EscrowAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'HELD',
    "releaseDueDate" DATETIME,
    "disputeDeadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "EscrowAccount_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EscrowAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EscrowAccount" ("balance", "createdAt", "disputeDeadline", "id", "orderId", "releaseDueDate", "status", "updatedAt", "userId") SELECT "balance", "createdAt", "disputeDeadline", "id", "orderId", "releaseDueDate", "status", "updatedAt", "userId" FROM "EscrowAccount";
DROP TABLE "EscrowAccount";
ALTER TABLE "new_EscrowAccount" RENAME TO "EscrowAccount";
CREATE UNIQUE INDEX "EscrowAccount_orderId_key" ON "EscrowAccount"("orderId");
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "isSystemMessage" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "senderId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("chatId", "content", "createdAt", "id", "isSystemMessage", "metadata", "read", "senderId") SELECT "chatId", "content", "createdAt", "id", "isSystemMessage", "metadata", "read", "senderId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
