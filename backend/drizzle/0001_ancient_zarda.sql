CREATE TYPE "public"."identity_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');--> statement-breakpoint
ALTER TABLE "pros" ADD COLUMN "identity_status" "identity_status" DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE "pros" ADD COLUMN "identity_document_url" text;--> statement-breakpoint
ALTER TABLE "pros" ADD COLUMN "verified_at" timestamp;