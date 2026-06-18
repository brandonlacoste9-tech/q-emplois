-- TaskReview for marketplace job ratings
CREATE TABLE "task_reviews" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_reviews_taskId_reviewerId_key" ON "task_reviews"("taskId", "reviewerId");
CREATE INDEX "task_reviews_revieweeId_idx" ON "task_reviews"("revieweeId");
CREATE INDEX "task_reviews_reviewerId_idx" ON "task_reviews"("reviewerId");

ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
