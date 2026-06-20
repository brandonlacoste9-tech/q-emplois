-- Task payment via Stripe Checkout
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "stripeCheckoutSessionId" TEXT;
