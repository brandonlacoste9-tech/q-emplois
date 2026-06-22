-- Messaging Phase 3: image attachments

ALTER TYPE "ChatMessageType" ADD VALUE IF NOT EXISTS 'image';

ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT;