-- Messaging Phase 1: system messages, per-job conversations, unread support

CREATE TYPE "ChatMessageType" AS ENUM ('text', 'system');

ALTER TABLE "chat_messages" ADD COLUMN "type" "ChatMessageType" NOT NULL DEFAULT 'text';

ALTER TABLE "chat_messages" ALTER COLUMN "senderId" DROP NOT NULL;

ALTER TABLE "chat_messages" DROP CONSTRAINT IF EXISTS "chat_messages_senderId_fkey";
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "chat_messages_conversationId_isRead_idx" ON "chat_messages"("conversationId", "isRead");

CREATE INDEX "conversations_taskId_idx" ON "conversations"("taskId");

-- One thread per client + tasker + job (NULL taskId rows remain legacy)
CREATE UNIQUE INDEX "conversations_clientId_providerId_taskId_key"
  ON "conversations"("clientId", "providerId", "taskId")
  WHERE "taskId" IS NOT NULL;