ALTER TABLE "credentials" ADD COLUMN IF NOT EXISTS "signature" text;
--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN IF NOT EXISTS "signing_key_id" text;
--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN IF NOT EXISTS "canonical_hash" text;
