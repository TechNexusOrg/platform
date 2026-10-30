CREATE TABLE IF NOT EXISTS "internship_programs" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"track" text DEFAULT 'systems' NOT NULL,
	"description" text NOT NULL,
	"duration_weeks" integer DEFAULT 8 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"prerequisites" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"learning_outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "internship_programs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cohorts" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL REFERENCES "internship_programs"("id") ON DELETE cascade,
	"name" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"capacity" integer DEFAULT 25 NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "internship_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL REFERENCES "internship_programs"("id") ON DELETE cascade,
	"cohort_id" text REFERENCES "cohorts"("id") ON DELETE set null,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"statement" text NOT NULL,
	"weekly_availability_hours" integer NOT NULL,
	"github_profile" text NOT NULL,
	"prior_experience" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" text REFERENCES "users"("id"),
	"review_notes" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "internship_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL REFERENCES "internship_programs"("id") ON DELETE cascade,
	"cohort_id" text REFERENCES "cohorts"("id") ON DELETE set null,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"mentor_id" text REFERENCES "users"("id"),
	"offer_letter_id" text,
	"offer_hash" text,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"target_end_date" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "internship_milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"program_id" text NOT NULL REFERENCES "internship_programs"("id") ON DELETE cascade,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"week_number" integer NOT NULL,
	"required_deliverables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "internship_work_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL REFERENCES "internship_enrollments"("id") ON DELETE cascade,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"week_number" integer NOT NULL,
	"hours_spent" integer NOT NULL,
	"summary" text NOT NULL,
	"pull_request_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blockers" text,
	"mentor_feedback" text,
	"mentor_reviewed_at" timestamp with time zone,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "internship_evaluations" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL REFERENCES "internship_enrollments"("id") ON DELETE cascade,
	"mentor_id" text NOT NULL REFERENCES "users"("id"),
	"code_quality_score" integer NOT NULL,
	"collaboration_score" integer NOT NULL,
	"punctuality_score" integer NOT NULL,
	"documentation_score" integer NOT NULL,
	"technical_initiative_score" integer NOT NULL,
	"overall_feedback" text NOT NULL,
	"recommend_completion" boolean DEFAULT true NOT NULL,
	"evaluated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "internship_programs_slug_idx" ON "internship_programs" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internship_programs_is_published_idx" ON "internship_programs" ("is_published");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cohorts_program_id_idx" ON "cohorts" ("program_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cohorts_status_idx" ON "cohorts" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internship_applications_user_idx" ON "internship_applications" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internship_applications_program_idx" ON "internship_applications" ("program_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internship_applications_status_idx" ON "internship_applications" ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "internship_enrollments_user_prog_idx" ON "internship_enrollments" ("user_id", "program_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internship_enrollments_user_idx" ON "internship_enrollments" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internship_enrollments_mentor_idx" ON "internship_enrollments" ("mentor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internship_enrollments_status_idx" ON "internship_enrollments" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internship_milestones_program_idx" ON "internship_milestones" ("program_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internship_milestones_week_idx" ON "internship_milestones" ("program_id", "week_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internship_work_logs_enrollment_idx" ON "internship_work_logs" ("enrollment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internship_work_logs_user_idx" ON "internship_work_logs" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internship_work_logs_week_idx" ON "internship_work_logs" ("enrollment_id", "week_number");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "internship_evaluations_enrollment_idx" ON "internship_evaluations" ("enrollment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internship_evaluations_mentor_idx" ON "internship_evaluations" ("mentor_id");
