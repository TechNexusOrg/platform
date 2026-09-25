CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contributions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"issue_id" text,
	"github_pr_number" integer NOT NULL,
	"pr_title" text NOT NULL,
	"pr_url" text NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"is_first_pr" boolean DEFAULT false NOT NULL,
	"merged_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"verification_source" text DEFAULT 'github_webhook' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"issuer" text DEFAULT 'TechNexusOrg' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"evidence_data" jsonb NOT NULL,
	"verification_url" text NOT NULL,
	"revoked_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founding_members" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"member_number" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"first_pr_id" text,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "founding_members_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "founding_members_member_number_unique" UNIQUE("member_number")
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"github_issue_id" integer NOT NULL,
	"github_issue_number" integer NOT NULL,
	"title" text NOT NULL,
	"body_snippet" text,
	"state" text DEFAULT 'open' NOT NULL,
	"html_url" text NOT NULL,
	"labels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"estimated_effort" text,
	"skills_required" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_good_first_issue" boolean DEFAULT false NOT NULL,
	"is_help_wanted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issues_github_issue_id_unique" UNIQUE("github_issue_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"experience_level" text DEFAULT 'beginner' NOT NULL,
	"preferred_languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contribution_preferences" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"github_repo" text NOT NULL,
	"description" text NOT NULL,
	"primary_language" text NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"difficulty" text DEFAULT 'all_levels' NOT NULL,
	"maintainer_id" text,
	"is_official" boolean DEFAULT true NOT NULL,
	"stars_count" integer DEFAULT 0 NOT NULL,
	"forks_count" integer DEFAULT 0 NOT NULL,
	"open_issues_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug"),
	CONSTRAINT "projects_github_repo_unique" UNIQUE("github_repo")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" integer NOT NULL,
	"github_username" text NOT NULL,
	"display_name" text,
	"email" text,
	"avatar_url" text,
	"bio" text,
	"location" text,
	"portfolio_url" text,
	"linkedin_url" text,
	"role" text DEFAULT 'contributor' NOT NULL,
	"level" text DEFAULT 'explorer' NOT NULL,
	"founding_number" integer,
	"is_onboarded" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id"),
	CONSTRAINT "users_github_username_unique" UNIQUE("github_username"),
	CONSTRAINT "users_founding_number_unique" UNIQUE("founding_number")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "founding_members" ADD CONSTRAINT "founding_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "founding_members" ADD CONSTRAINT "founding_members_first_pr_id_contributions_id_fk" FOREIGN KEY ("first_pr_id") REFERENCES "public"."contributions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_maintainer_id_users_id_fk" FOREIGN KEY ("maintainer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "contributions_user_id_idx" ON "contributions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contributions_project_id_idx" ON "contributions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "contributions_state_idx" ON "contributions" USING btree ("state");--> statement-breakpoint
CREATE UNIQUE INDEX "contributions_pr_url_idx" ON "contributions" USING btree ("pr_url");--> statement-breakpoint
CREATE UNIQUE INDEX "credentials_id_idx" ON "credentials" USING btree ("id");--> statement-breakpoint
CREATE INDEX "credentials_user_id_idx" ON "credentials" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credentials_type_idx" ON "credentials" USING btree ("type");--> statement-breakpoint
CREATE INDEX "credentials_status_idx" ON "credentials" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "founding_members_number_idx" ON "founding_members" USING btree ("member_number");--> statement-breakpoint
CREATE UNIQUE INDEX "founding_members_user_id_idx" ON "founding_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "issues_github_issue_id_idx" ON "issues" USING btree ("github_issue_id");--> statement-breakpoint
CREATE INDEX "issues_project_id_idx" ON "issues" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "issues_difficulty_idx" ON "issues" USING btree ("difficulty");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_user_id_idx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_repo_idx" ON "projects" USING btree ("github_repo");--> statement-breakpoint
CREATE UNIQUE INDEX "users_github_id_idx" ON "users" USING btree ("github_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_github_username_idx" ON "users" USING btree ("github_username");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_level_idx" ON "users" USING btree ("level");