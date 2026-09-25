-- Add new columns to profiles
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "technologies" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "tools" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "time_commitment" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "primary_goal" text;--> statement-breakpoint

-- Add new columns to projects for quality gate and trust boundary
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "contribution_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "first_pr_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "approved_at" timestamp with time zone DEFAULT now();--> statement-breakpoint

-- Create issue_claims table
CREATE TABLE IF NOT EXISTS "issue_claims" (
	"id" text PRIMARY KEY NOT NULL,
	"issue_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Create pull_requests table
CREATE TABLE IF NOT EXISTS "pull_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"issue_id" text,
	"github_pr_id" integer NOT NULL,
	"github_pr_number" integer NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"draft" boolean DEFAULT false NOT NULL,
	"merge_commit_sha" text,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"merged_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pull_requests_url_unique" UNIQUE("url")
);--> statement-breakpoint

-- Create pull_request_reviews table
CREATE TABLE IF NOT EXISTS "pull_request_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"pull_request_id" text NOT NULL,
	"reviewer_github_id" integer NOT NULL,
	"reviewer_username" text NOT NULL,
	"review_state" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"github_review_id" integer,
	"html_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Create github_webhook_deliveries table
CREATE TABLE IF NOT EXISTS "github_webhook_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"delivery_id" text NOT NULL,
	"event_type" text NOT NULL,
	"repository" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"status" text DEFAULT 'received' NOT NULL,
	"error" text,
	CONSTRAINT "webhook_deliveries_delivery_id_unique" UNIQUE("delivery_id")
);--> statement-breakpoint

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Create mentor_requests table
CREATE TABLE IF NOT EXISTS "mentor_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"mentor_id" text,
	"issue_id" text NOT NULL,
	"message" text NOT NULL,
	"reply" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);--> statement-breakpoint

-- Add Foreign Keys
ALTER TABLE "issue_claims" ADD CONSTRAINT "issue_claims_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_claims" ADD CONSTRAINT "issue_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "pull_request_reviews" ADD CONSTRAINT "pr_reviews_pull_request_id_pull_requests_id_fk" FOREIGN KEY ("pull_request_id") REFERENCES "public"."pull_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "mentor_requests" ADD CONSTRAINT "mentor_requests_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_requests" ADD CONSTRAINT "mentor_requests_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_requests" ADD CONSTRAINT "mentor_requests_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Indexes
CREATE INDEX IF NOT EXISTS "issue_claims_issue_id_idx" ON "issue_claims" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "issue_claims_user_id_idx" ON "issue_claims" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "issue_claims_status_idx" ON "issue_claims" USING btree ("status");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pull_requests_user_id_idx" ON "pull_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pull_requests_project_id_idx" ON "pull_requests" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pull_requests_issue_id_idx" ON "pull_requests" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pull_requests_state_idx" ON "pull_requests" USING btree ("state");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "pr_reviews_pull_request_id_idx" ON "pull_request_reviews" USING btree ("pull_request_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pr_reviews_reviewer_username_idx" ON "pull_request_reviews" USING btree ("reviewer_username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pr_reviews_review_state_idx" ON "pull_request_reviews" USING btree ("review_state");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "webhook_deliveries_status_idx" ON "github_webhook_deliveries" USING btree ("status");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "mentor_requests_student_id_idx" ON "mentor_requests" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentor_requests_mentor_id_idx" ON "mentor_requests" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentor_requests_issue_id_idx" ON "mentor_requests" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mentor_requests_status_idx" ON "mentor_requests" USING btree ("status");
