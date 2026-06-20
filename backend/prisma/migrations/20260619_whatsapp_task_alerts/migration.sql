-- WhatsApp task alerts for taskers
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "whatsappNotifyEnabled" BOOLEAN NOT NULL DEFAULT false;
