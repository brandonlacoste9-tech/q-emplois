-- CreateEnum
CREATE TYPE "TaskApplicationStatus" AS ENUM ('pending', 'selected', 'rejected', 'withdrawn');

-- AlterEnum
ALTER TYPE "CreditTransactionType" ADD VALUE IF NOT EXISTS 'apply';

-- CreateTable
CREATE TABLE "task_applications" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "taskerId" TEXT NOT NULL,
    "message" TEXT,
    "status" "TaskApplicationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_applications_taskId_idx" ON "task_applications"("taskId");

-- CreateIndex
CREATE INDEX "task_applications_taskerId_idx" ON "task_applications"("taskerId");

-- CreateIndex
CREATE INDEX "task_applications_status_idx" ON "task_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "task_applications_taskId_taskerId_key" ON "task_applications"("taskId", "taskerId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- AddForeignKey
ALTER TABLE "task_applications" ADD CONSTRAINT "task_applications_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_applications" ADD CONSTRAINT "task_applications_taskerId_fkey" FOREIGN KEY ("taskerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
