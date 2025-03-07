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
    CONSTRAINT "EscrowAccount_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EscrowAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EscrowAccount" ("balance", "createdAt", "disputeDeadline", "id", "orderId", "releaseDueDate", "status", "updatedAt", "userId") SELECT "balance", "createdAt", "disputeDeadline", "id", "orderId", "releaseDueDate", "status", "updatedAt", "userId" FROM "EscrowAccount";
DROP TABLE "EscrowAccount";
ALTER TABLE "new_EscrowAccount" RENAME TO "EscrowAccount";
CREATE UNIQUE INDEX "EscrowAccount_orderId_key" ON "EscrowAccount"("orderId");
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "escrowAccountId" TEXT,
    "escrowFee" INTEGER,
    "releaseDueDate" DATETIME,
    "disputeReason" TEXT,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_escrowAccountId_fkey" FOREIGN KEY ("escrowAccountId") REFERENCES "EscrowAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "createdAt", "disputeReason", "escrowAccountId", "escrowFee", "id", "orderId", "reference", "releaseDueDate", "status", "type", "updatedAt", "userId") SELECT "amount", "createdAt", "disputeReason", "escrowAccountId", "escrowFee", "id", "orderId", "reference", "releaseDueDate", "status", "type", "updatedAt", "userId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
