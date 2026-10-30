ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "github_repo_id" integer;
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "github_owner_id" integer;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_github_repo_id_idx" ON "projects" ("github_repo_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_github_owner_id_idx" ON "projects" ("github_owner_id");
