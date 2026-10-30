ALTER TABLE "users" ALTER COLUMN "is_public" SET DEFAULT false;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "public_consent_given_at" timestamp with time zone;
