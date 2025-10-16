-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "emailVerified" DATETIME,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "walletAddress" TEXT,
    "walletChainId" INTEGER,
    "userUAL" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "kaPending" BOOLEAN NOT NULL DEFAULT false,
    "kaError" TEXT,
    "kaAttempts" INTEGER NOT NULL DEFAULT 0,
    "kaQueuedAt" DATETIME
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "kaAttempts", "kaError", "kaPending", "kaQueuedAt", "passwordHash", "updatedAt", "userUAL", "walletAddress", "walletChainId") SELECT "createdAt", "email", "emailVerified", "id", "kaAttempts", "kaError", "kaPending", "kaQueuedAt", "passwordHash", "updatedAt", "userUAL", "walletAddress", "walletChainId" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
CREATE UNIQUE INDEX "User_userUAL_key" ON "User"("userUAL");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
