/*
  Warnings:

  - You are about to drop the column `pipelineId` on the `Job` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subjectId" TEXT,
    "parentJobId" TEXT,
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
INSERT INTO "new_Job" ("attempts", "createdAt", "error", "finishedAt", "id", "maxAttempts", "parentJobId", "payload", "scheduledAt", "startedAt", "status", "subjectId", "type", "updatedAt") SELECT "attempts", "createdAt", "error", "finishedAt", "id", "maxAttempts", "parentJobId", "payload", "scheduledAt", "startedAt", "status", "subjectId", "type", "updatedAt" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE INDEX "Job_type_status_scheduledAt_idx" ON "Job"("type", "status", "scheduledAt");
CREATE INDEX "Job_type_subjectId_status_idx" ON "Job"("type", "subjectId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
