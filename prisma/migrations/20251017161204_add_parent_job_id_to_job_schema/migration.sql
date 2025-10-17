-- AlterTable
ALTER TABLE "Job" ADD COLUMN "parentJobId" TEXT;
ALTER TABLE "Job" ADD COLUMN "pipelineId" TEXT;

-- CreateIndex
CREATE INDEX "Job_pipelineId_idx" ON "Job"("pipelineId");
