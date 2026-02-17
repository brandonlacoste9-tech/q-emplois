CREATE TABLE "traction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"pro_id" uuid NOT NULL,
	"lead_id" uuid,
	"partner_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "traction" ADD CONSTRAINT "traction_pro_id_pros_id_fk" FOREIGN KEY ("pro_id") REFERENCES "public"."pros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traction" ADD CONSTRAINT "traction_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;