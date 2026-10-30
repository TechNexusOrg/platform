CREATE TABLE IF NOT EXISTS "partner_proposals" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_name" text NOT NULL,
  "contact_name" text NOT NULL,
  "contact_email" text NOT NULL,
  "partner_type" text NOT NULL,
  "proposal_type" text NOT NULL,
  "summary" text NOT NULL,
  "target_technologies" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "estimated_student_capacity" integer DEFAULT 10 NOT NULL,
  "status" text DEFAULT 'submitted' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_proposals_status_idx" ON "partner_proposals" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_proposals_created_at_idx" ON "partner_proposals" ("created_at");
