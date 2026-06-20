-- Profile avatars and task photos
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "photoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
