-- Founding tasker invite codes
CREATE TABLE IF NOT EXISTS "invite_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "maxRedemptions" INTEGER NOT NULL DEFAULT 50,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "rewardCredits" INTEGER NOT NULL DEFAULT 100,
    "lifetimeDiscountPct" INTEGER NOT NULL DEFAULT 15,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "invite_codes_code_key" ON "invite_codes"("code");