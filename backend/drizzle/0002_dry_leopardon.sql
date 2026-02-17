CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titre" text NOT NULL,
	"client" text NOT NULL,
	"localisation" text NOT NULL,
	"montant_net" numeric(10, 2) NOT NULL,
	"tps" numeric(10, 2) NOT NULL,
	"tvq" numeric(10, 2) NOT NULL,
	"sceau_authenticite" boolean DEFAULT true NOT NULL,
	"source" text DEFAULT 'max-ti-guy',
	"pro_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_pro_id_pros_id_fk" FOREIGN KEY ("pro_id") REFERENCES "public"."pros"("id") ON DELETE set null ON UPDATE no action;