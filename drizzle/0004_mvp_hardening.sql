ALTER TABLE "projects" ALTER COLUMN "is_official" SET DEFAULT false;
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "contribution_enabled" SET DEFAULT false;
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "first_pr_enabled" SET DEFAULT false;
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "approved_at" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "issues" ALTER COLUMN "difficulty" SET DEFAULT 'unclassified';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "issue_claims_active_issue_idx" ON "issue_claims" ("issue_id") WHERE "status" = 'active';
--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN IF NOT EXISTS "claim_id" text REFERENCES "issue_claims"("id");
--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN IF NOT EXISTS "association_status" text NOT NULL DEFAULT 'unlinked';
--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN IF NOT EXISTS "association_source" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pull_requests_claim_id_idx" ON "pull_requests" ("claim_id");
--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN IF NOT EXISTS "claim_id" text REFERENCES "issue_claims"("id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contributions_claim_id_idx" ON "contributions" ("claim_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "founding_allocation_counter" (
	"id" text PRIMARY KEY NOT NULL,
	"current_number" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO "founding_allocation_counter" ("id", "current_number")
VALUES ('founding_1000', 0)
ON CONFLICT ("id") DO NOTHING;
