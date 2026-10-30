CREATE TABLE IF NOT EXISTS "learning_tracks" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"estimated_hours" integer DEFAULT 10 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"prerequisites" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_tracks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_modules" (
	"id" text PRIMARY KEY NOT NULL,
	"track_id" text NOT NULL REFERENCES "learning_tracks"("id") ON DELETE cascade,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL REFERENCES "learning_modules"("id") ON DELETE cascade,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"estimated_minutes" integer DEFAULT 15 NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"track_id" text NOT NULL REFERENCES "learning_tracks"("id") ON DELETE cascade,
	"status" text DEFAULT 'enrolled' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lesson_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"lesson_id" text NOT NULL REFERENCES "learning_lessons"("id") ON DELETE cascade,
	"completed" boolean DEFAULT true NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL REFERENCES "learning_lessons"("id") ON DELETE cascade,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"acceptance_criteria" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"submission_type" text DEFAULT 'text_submission' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assignment_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL REFERENCES "learning_assignments"("id") ON DELETE cascade,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"content" text NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"reviewed_by" text REFERENCES "users"("id"),
	"feedback" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "learning_tracks_slug_idx" ON "learning_tracks" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_tracks_is_published_idx" ON "learning_tracks" ("is_published");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_modules_track_id_idx" ON "learning_modules" ("track_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_modules_order_idx" ON "learning_modules" ("track_id", "order_index");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_lessons_module_id_idx" ON "learning_lessons" ("module_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_lessons_order_idx" ON "learning_lessons" ("module_id", "order_index");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "learning_enrollments_user_track_idx" ON "learning_enrollments" ("user_id", "track_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_enrollments_user_id_idx" ON "learning_enrollments" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_enrollments_track_id_idx" ON "learning_enrollments" ("track_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lesson_progress_user_lesson_idx" ON "lesson_progress" ("user_id", "lesson_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lesson_progress_user_id_idx" ON "lesson_progress" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lesson_progress_lesson_id_idx" ON "lesson_progress" ("lesson_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learning_assignments_lesson_id_idx" ON "learning_assignments" ("lesson_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignment_submissions_user_idx" ON "assignment_submissions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignment_submissions_assignment_idx" ON "assignment_submissions" ("assignment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignment_submissions_status_idx" ON "assignment_submissions" ("status");
