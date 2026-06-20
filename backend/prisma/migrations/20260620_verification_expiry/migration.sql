-- Verification expiry: 12-month rolling window for tasker ID verification.
-- Cron flips isVerified=false once verificationExpiresAt has passed.
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "verificationExpiresAt" TIMESTAMP(3);