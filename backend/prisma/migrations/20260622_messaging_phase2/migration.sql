-- Messaging Phase 2: pre-match application conversations

CREATE TYPE "ConversationStatus" AS ENUM ('application', 'active', 'archived');

ALTER TABLE "conversations" ADD COLUMN "status" "ConversationStatus" NOT NULL DEFAULT 'active';

CREATE INDEX "conversations_status_idx" ON "conversations"("status");