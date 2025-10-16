-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "emailVerified" DATETIME,
    "passwordHash" TEXT,
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

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "mime" TEXT,
    "size" INTEGER,
    "ipfsCid" TEXT,
    "contentHash" TEXT,
    "ual" TEXT,
    "ownerAddress" TEXT,
    "custody" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "File_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Passport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "signerAddress" TEXT NOT NULL,
    "eip712Domain" JSONB NOT NULL,
    "eip712Types" JSONB NOT NULL,
    "eip712Message" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Passport_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_userUAL_key" ON "User"("userUAL");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_ual_key" ON "Asset"("ual");

-- CreateIndex
CREATE INDEX "Asset_userId_status_idx" ON "Asset"("userId", "status");

-- CreateIndex
CREATE INDEX "Job_type_status_scheduledAt_idx" ON "Job"("type", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Job_type_subjectId_status_idx" ON "Job"("type", "subjectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "File_assetId_variant_key" ON "File"("assetId", "variant");

-- CreateIndex
CREATE INDEX "Passport_assetId_signerAddress_idx" ON "Passport"("assetId", "signerAddress");
