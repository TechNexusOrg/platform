import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// --- USERS TABLE ---
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // nanoid or uuid
    githubId: integer("github_id").notNull().unique(),
    githubUsername: text("github_username").notNull().unique(),
    displayName: text("display_name"),
    email: text("email"),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    location: text("location"),
    portfolioUrl: text("portfolio_url"),
    linkedinUrl: text("linkedin_url"),
    role: text("role", { enum: ["contributor", "maintainer", "admin"] })
      .default("contributor")
      .notNull(),
    level: text("level", {
      enum: [
        "explorer",
        "contributor",
        "active_contributor",
        "core_contributor",
        "maintainer",
        "project_lead",
        "mentor",
      ],
    })
      .default("explorer")
      .notNull(),
    foundingNumber: integer("founding_number").unique(),
    isOnboarded: boolean("is_onboarded").default(false).notNull(),
    isPublic: boolean("is_public").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_github_id_idx").on(table.githubId),
    uniqueIndex("users_github_username_idx").on(table.githubUsername),
    index("users_role_idx").on(table.role),
    index("users_level_idx").on(table.level),
  ]
);

// --- CONTRIBUTOR PROFILES ---
export const profiles = pgTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    skills: jsonb("skills").$type<string[]>().default([]).notNull(),
    interests: jsonb("interests").$type<string[]>().default([]).notNull(),
    experienceLevel: text("experience_level", {
      enum: ["complete_beginner", "beginner", "intermediate", "advanced"],
    })
      .default("beginner")
      .notNull(),
    preferredLanguages: jsonb("preferred_languages")
      .$type<string[]>()
      .default([])
      .notNull(),
    technologies: jsonb("technologies")
      .$type<string[]>()
      .default([])
      .notNull(),
    tools: jsonb("tools")
      .$type<string[]>()
      .default([])
      .notNull(),
    contributionPreferences: jsonb("contribution_preferences")
      .$type<string[]>()
      .default([])
      .notNull(),
    timeCommitment: text("time_commitment"),
    primaryGoal: text("primary_goal"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("profiles_user_id_idx").on(table.userId)]
);

// --- PROJECTS ---
export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    githubRepo: text("github_repo").notNull().unique(), // e.g. "TechNexusOrg/platform"
    description: text("description").notNull(),
    primaryLanguage: text("primary_language").notNull(),
    languages: jsonb("languages").$type<string[]>().default([]).notNull(),
    difficulty: text("difficulty", {
      enum: ["all_levels", "beginner", "intermediate", "advanced"],
    })
      .default("all_levels")
      .notNull(),
    maintainerId: text("maintainer_id").references(() => users.id),
    isOfficial: boolean("is_official").default(true).notNull(),
    contributionEnabled: boolean("contribution_enabled").default(true).notNull(),
    firstPrEnabled: boolean("first_pr_enabled").default(true).notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }).defaultNow(),
    starsCount: integer("stars_count").default(0).notNull(),
    forksCount: integer("forks_count").default(0).notNull(),
    openIssuesCount: integer("open_issues_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("projects_slug_idx").on(table.slug),
    uniqueIndex("projects_repo_idx").on(table.githubRepo),
  ]
);

// --- ISSUES ---
export const issues = pgTable(
  "issues",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    githubIssueId: integer("github_issue_id").notNull().unique(),
    githubIssueNumber: integer("github_issue_number").notNull(),
    title: text("title").notNull(),
    bodySnippet: text("body_snippet"),
    state: text("state", { enum: ["open", "closed"] })
      .default("open")
      .notNull(),
    htmlUrl: text("html_url").notNull(),
    labels: jsonb("labels").$type<string[]>().default([]).notNull(),
    difficulty: text("difficulty", {
      enum: ["beginner", "intermediate", "advanced"],
    })
      .default("beginner")
      .notNull(),
    estimatedEffort: text("estimated_effort"), // e.g. "2-4 hours"
    skillsRequired: jsonb("skills_required").$type<string[]>().default([]).notNull(),
    isGoodFirstIssue: boolean("is_good_first_issue").default(false).notNull(),
    isHelpWanted: boolean("is_help_wanted").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("issues_github_issue_id_idx").on(table.githubIssueId),
    index("issues_project_id_idx").on(table.projectId),
    index("issues_difficulty_idx").on(table.difficulty),
  ]
);

// --- CONTRIBUTIONS ---
export const contributions = pgTable(
  "contributions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    issueId: text("issue_id").references(() => issues.id),
    githubPrNumber: integer("github_pr_number").notNull(),
    prTitle: text("pr_title").notNull(),
    prUrl: text("pr_url").notNull(),
    state: text("state", { enum: ["open", "merged", "closed"] })
      .default("open")
      .notNull(),
    isFirstPr: boolean("is_first_pr").default(false).notNull(),
    mergedAt: timestamp("merged_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verificationSource: text("verification_source").default("github_webhook").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("contributions_user_id_idx").on(table.userId),
    index("contributions_project_id_idx").on(table.projectId),
    index("contributions_state_idx").on(table.state),
    uniqueIndex("contributions_pr_url_idx").on(table.prUrl),
  ]
);

// --- VERIFIABLE CREDENTIALS ---
export const credentials = pgTable(
  "credentials",
  {
    id: text("id").primaryKey(), // canonical credential ID, e.g. "cred_tn_firstpr_..."
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: [
        "first_pr_merged",
        "verified_contributor",
        "core_contributor",
        "founding_1000",
        "maintainer",
        "mentor",
      ],
    }).notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: text("status", { enum: ["active", "revoked"] })
      .default("active")
      .notNull(),
    issuer: text("issuer").default("TechNexusOrg").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    evidenceData: jsonb("evidence_data").notNull(), // contains PR URL, repository, commit SHA, verification timestamp
    verificationUrl: text("verification_url").notNull(),
    revokedReason: text("revoked_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("credentials_id_idx").on(table.id),
    index("credentials_user_id_idx").on(table.userId),
    index("credentials_type_idx").on(table.type),
    index("credentials_status_idx").on(table.status),
  ]
);

// --- FOUNDING 1,000 REGISTRY ---
export const foundingMembers = pgTable(
  "founding_members",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    memberNumber: integer("member_number").notNull().unique(), // 1 to 1000
    status: text("status", { enum: ["active", "graduated", "inactive"] })
      .default("active")
      .notNull(),
    firstPrId: text("first_pr_id").references(() => contributions.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("founding_members_number_idx").on(table.memberNumber),
    uniqueIndex("founding_members_user_id_idx").on(table.userId),
  ]
);

// --- AUDIT LOGS ---
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id").references(() => users.id),
    action: text("action").notNull(), // e.g. "credential.issue", "credential.revoke", "user.role_change"
    targetType: text("target_type").notNull(), // e.g. "credential", "user", "project"
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_actor_id_idx").on(table.actorId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_target_idx").on(table.targetType, table.targetId),
  ]
);

// --- ISSUE CLAIMS ---
export const issueClaims = pgTable(
  "issue_claims",
  {
    id: text("id").primaryKey(),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["active", "completed", "released", "expired", "cancelled"],
    })
      .default("active")
      .notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("issue_claims_issue_id_idx").on(table.issueId),
    index("issue_claims_user_id_idx").on(table.userId),
    index("issue_claims_status_idx").on(table.status),
  ]
);

// --- PULL REQUESTS ---
export const pullRequests = pgTable(
  "pull_requests",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    issueId: text("issue_id").references(() => issues.id),
    githubPrId: integer("github_pr_id").notNull(),
    githubPrNumber: integer("github_pr_number").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull().unique(),
    state: text("state", {
      enum: ["open", "approved", "changes_requested", "merged", "closed"],
    })
      .default("open")
      .notNull(),
    draft: boolean("draft").default(false).notNull(),
    mergeCommitSha: text("merge_commit_sha"),
    openedAt: timestamp("opened_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    mergedAt: timestamp("merged_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("pull_requests_url_idx").on(table.url),
    index("pull_requests_user_id_idx").on(table.userId),
    index("pull_requests_project_id_idx").on(table.projectId),
    index("pull_requests_issue_id_idx").on(table.issueId),
    index("pull_requests_state_idx").on(table.state),
  ]
);

// --- PULL REQUEST REVIEWS ---
export const pullRequestReviews = pgTable(
  "pull_request_reviews",
  {
    id: text("id").primaryKey(),
    pullRequestId: text("pull_request_id")
      .notNull()
      .references(() => pullRequests.id, { onDelete: "cascade" }),
    reviewerGithubId: integer("reviewer_github_id").notNull(),
    reviewerUsername: text("reviewer_username").notNull(),
    reviewState: text("review_state", {
      enum: ["approved", "changes_requested", "commented", "dismissed"],
    }).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    githubReviewId: integer("github_review_id"),
    htmlUrl: text("html_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("pr_reviews_pull_request_id_idx").on(table.pullRequestId),
    index("pr_reviews_reviewer_username_idx").on(table.reviewerUsername),
    index("pr_reviews_review_state_idx").on(table.reviewState),
  ]
);

// --- GITHUB WEBHOOK DELIVERIES (IDEMPOTENCY) ---
export const githubWebhookDeliveries = pgTable(
  "github_webhook_deliveries",
  {
    id: text("id").primaryKey(),
    deliveryId: text("delivery_id").notNull().unique(),
    eventType: text("event_type").notNull(),
    repository: text("repository").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    status: text("status", { enum: ["received", "processed", "ignored", "error"] })
      .default("received")
      .notNull(),
    error: text("error"),
  },
  (table) => [
    uniqueIndex("webhook_deliveries_delivery_id_idx").on(table.deliveryId),
    index("webhook_deliveries_status_idx").on(table.status),
  ]
);

// --- NOTIFICATIONS ---
export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    linkUrl: text("link_url"),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_is_read_idx").on(table.isRead),
  ]
);

// --- MENTOR REQUESTS ---
export const mentorRequests = pgTable(
  "mentor_requests",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mentorId: text("mentor_id").references(() => users.id),
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    reply: text("reply"),
    status: text("status", { enum: ["open", "in_progress", "resolved", "closed"] })
      .default("open")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("mentor_requests_student_id_idx").on(table.studentId),
    index("mentor_requests_mentor_id_idx").on(table.mentorId),
    index("mentor_requests_issue_id_idx").on(table.issueId),
    index("mentor_requests_status_idx").on(table.status),
  ]
);
