-- Verification audit fields (Loi 25 + better tasker UX)
-- Adds who approved, when rejected, and why rejected to the providers table.
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;