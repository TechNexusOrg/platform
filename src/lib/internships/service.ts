import { getDb, schema } from "@/lib/db";
import { eq, and, asc, desc } from "drizzle-orm";
import { generateOfferLetter } from "./offer-letter";

export interface CreateApplicationParams {
  programId: string;
  cohortId?: string;
  statement: string;
  weeklyAvailabilityHours: number;
  githubProfile: string;
  priorExperience: string;
}

export interface ReviewApplicationParams {
  status: "accepted" | "rejected";
  mentorId?: string;
  notes?: string;
}

export interface SubmitWorkLogParams {
  weekNumber: number;
  hoursSpent: number;
  summary: string;
  pullRequestUrls: string[];
  blockers?: string;
}

export interface InternshipEvaluationRubric {
  codeQualityScore: number; // 1 to 5
  collaborationScore: number; // 1 to 5
  punctualityScore: number; // 1 to 5
  documentationScore: number; // 1 to 5
  technicalInitiativeScore: number; // 1 to 5
  overallFeedback: string;
  recommendCompletion: boolean;
}

export const PILOT_INTERNSHIP_PROGRAMS = [
  {
    slug: "platform-engineering",
    title: "Platform Engineering & Systems Fellowship",
    track: "systems" as const,
    description:
      "A rigorous 8-week supervised engineering fellowship focused on distributed backend architecture, high-throughput queue processing, POSIX system internals, and automated CI/CD infrastructure.",
    durationWeeks: 8,
    isPublished: true,
    prerequisites: [
      "Completion of Linux Fundamentals and Administration learning track",
      "Demonstrated experience with TypeScript or Go backend development",
      "Minimum 1 merged pull request or verified open-source contribution",
    ],
    learningOutcomes: [
      "Design and author production Go/TypeScript backend microservices",
      "Implement safe asynchronous job processing with PostgreSQL queues",
      "Hardening API trust boundaries and automated CI status checks",
      "Lead code reviews on open-source repositories",
    ],
    milestones: [
      {
        weekNumber: 2,
        orderIndex: 1,
        title: "Architecture Exploration & Subsystem Audit",
        description:
          "Inspect codebase architecture, verify development environment, and author a comprehensive architecture review with identified improvements.",
        requiredDeliverables: [
          "Local environment configuration verification",
          "Initial triage and reproduction of two open issues",
        ],
      },
      {
        weekNumber: 4,
        orderIndex: 2,
        title: "Core Feature Implementation & Test Suite",
        description:
          "Author a feature branch implementing an approved issue with thorough unit and integration test coverage.",
        requiredDeliverables: [
          "Feature branch with atomic Conventional Commits",
          "Unit and integration tests passing in CI",
        ],
      },
      {
        weekNumber: 6,
        orderIndex: 3,
        title: "Performance Profiling & Security Hardening",
        description:
          "Benchmark subsystem latency, identify query bottlenecks, and harden API input validation boundaries.",
        requiredDeliverables: [
          "Performance benchmark report",
          "Security audit and fail-closed validation diff",
        ],
      },
      {
        weekNumber: 8,
        orderIndex: 4,
        title: "Capstone Pull Request & Maintainer Review",
        description:
          "Finalize production pull request, address maintainer review comments via interactive rebase, and publish documentation.",
        requiredDeliverables: [
          "Merged production Pull Request",
          "Final fellowship presentation and technical retrospective",
        ],
      },
    ],
  },
  {
    slug: "fullstack-fellowship",
    title: "Full-Stack Open-Source Fellowship",
    track: "web_fullstack" as const,
    description:
      "An 8-week production engineering fellowship building scalable web applications with Next.js App Router, React Server Components, Tailwind CSS, and Drizzle ORM.",
    durationWeeks: 8,
    isPublished: true,
    prerequisites: [
      "Completion of Git and Professional Open-Source Development learning track",
      "Proficiency with modern TypeScript and React",
      "Minimum 10 hours per week committed availability",
    ],
    learningOutcomes: [
      "Build accessible Next.js App Router applications with strict SSR/SSG patterns",
      "Architect type-safe database schemas and migrations with Drizzle ORM",
      "Implement privacy-by-default GDPR compliant user flows",
      "Publish and maintain production design systems",
    ],
    milestones: [
      {
        weekNumber: 2,
        orderIndex: 1,
        title: "Design System & Frontend Architecture",
        description:
          "Explore component hierarchy, implement responsive UI views, and verify WCAG 2.1 AA accessibility.",
        requiredDeliverables: [
          "Accessible component implementation",
          "Interactive story/mock verification",
        ],
      },
      {
        weekNumber: 4,
        orderIndex: 2,
        title: "Full-Stack API & Database Integration",
        description:
          "Develop server actions/route handlers and execute zero-downtime database migrations.",
        requiredDeliverables: [
          "API route handlers with Zod schema validation",
          "Drizzle migration and schema update",
        ],
      },
      {
        weekNumber: 6,
        orderIndex: 3,
        title: "Privacy & Data Portability Verification",
        description:
          "Incorporate GDPR privacy consent toggles, data export endpoints, and user deletion flows.",
        requiredDeliverables: [
          "Privacy settings form and integration test suite",
          "Automated export/erasure endpoint tests",
        ],
      },
      {
        weekNumber: 8,
        orderIndex: 4,
        title: "Production Release & Contributor Portfolio",
        description:
          "Deliver end-to-end features to production, review fellow contributors' PRs, and publish portfolio showcase.",
        requiredDeliverables: [
          "Production feature merged into main",
          "Verified contributor credential generated",
        ],
      },
    ],
  },
];

/**
 * Seeds pilot fellowship programs, cohorts, and milestones idempotently.
 */
export async function seedPilotInternships(database?: any) {
  const db = database || (await getDb());

  for (const progData of PILOT_INTERNSHIP_PROGRAMS) {
    let [program] = await db
      .select()
      .from(schema.internshipPrograms)
      .where(eq(schema.internshipPrograms.slug, progData.slug));

    const programId = program?.id || `prog_${crypto.randomUUID()}`;

    if (!program) {
      [program] = await db
        .insert(schema.internshipPrograms)
        .values({
          id: programId,
          slug: progData.slug,
          title: progData.title,
          track: progData.track,
          description: progData.description,
          durationWeeks: progData.durationWeeks,
          isPublished: progData.isPublished,
          prerequisites: progData.prerequisites,
          learningOutcomes: progData.learningOutcomes,
        })
        .returning();
    } else {
      await db
        .update(schema.internshipPrograms)
        .set({
          title: progData.title,
          track: progData.track,
          description: progData.description,
          durationWeeks: progData.durationWeeks,
          isPublished: progData.isPublished,
          prerequisites: progData.prerequisites,
          learningOutcomes: progData.learningOutcomes,
          updatedAt: new Date(),
        })
        .where(eq(schema.internshipPrograms.id, programId));
    }

    // Seed default upcoming cohort
    const [existingCohort] = await db
      .select()
      .from(schema.cohorts)
      .where(eq(schema.cohorts.programId, programId));

    if (!existingCohort) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // Starts in 1 week
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + progData.durationWeeks * 7);

      await db.insert(schema.cohorts).values({
        id: `coh_${crypto.randomUUID()}`,
        programId,
        name: "Winter 2026 Alpha Cohort",
        startDate,
        endDate,
        capacity: 25,
        status: "upcoming",
      });
    }

    // Seed milestones
    for (const msData of progData.milestones) {
      const [existingMs] = await db
        .select()
        .from(schema.internshipMilestones)
        .where(
          and(
            eq(schema.internshipMilestones.programId, programId),
            eq(schema.internshipMilestones.weekNumber, msData.weekNumber)
          )
        );

      if (!existingMs) {
        await db.insert(schema.internshipMilestones).values({
          id: `imst_${crypto.randomUUID()}`,
          programId,
          title: msData.title,
          description: msData.description,
          weekNumber: msData.weekNumber,
          requiredDeliverables: msData.requiredDeliverables,
          orderIndex: msData.orderIndex,
        });
      }
    }
  }
}

/**
 * Lists published internship programs with milestone counts and cohort details.
 */
export async function listInternshipPrograms(database?: any) {
  const db = database || (await getDb());

  const programs = await db
    .select()
    .from(schema.internshipPrograms)
    .where(eq(schema.internshipPrograms.isPublished, true));

  if (programs.length === 0) {
    await seedPilotInternships(db);
    return listInternshipPrograms(db);
  }

  const results = [];

  for (const prog of programs) {
    const cohortsList = await db
      .select()
      .from(schema.cohorts)
      .where(eq(schema.cohorts.programId, prog.id))
      .orderBy(asc(schema.cohorts.startDate));

    const milestones = await db
      .select()
      .from(schema.internshipMilestones)
      .where(eq(schema.internshipMilestones.programId, prog.id))
      .orderBy(asc(schema.internshipMilestones.orderIndex));

    results.push({
      ...prog,
      prerequisites: (prog.prerequisites as string[]) || [],
      learningOutcomes: (prog.learningOutcomes as string[]) || [],
      cohorts: cohortsList,
      milestones,
    });
  }

  return results;
}

/**
 * Submits an application for an internship fellowship.
 */
export async function applyForInternship(
  userId: string,
  params: CreateApplicationParams,
  database?: any
) {
  const db = database || (await getDb());

  if (!params.statement || params.statement.trim().length < 50) {
    throw new Error(
      "Statement of purpose must be at least 50 characters explaining your goals and technical interest."
    );
  }

  if (params.weeklyAvailabilityHours < 10) {
    throw new Error(
      "Fellowship requires a minimum commitment of 10 hours per week."
    );
  }

  const [program] = await db
    .select()
    .from(schema.internshipPrograms)
    .where(eq(schema.internshipPrograms.id, params.programId));

  if (!program) {
    throw new Error("Internship program not found");
  }

  // Prevent duplicate pending applications
  const [existingApp] = await db
    .select()
    .from(schema.internshipApplications)
    .where(
      and(
        eq(schema.internshipApplications.userId, userId),
        eq(schema.internshipApplications.programId, params.programId),
        eq(schema.internshipApplications.status, "pending")
      )
    );

  if (existingApp) {
    throw new Error("You already have a pending application for this fellowship.");
  }

  const [application] = await db
    .insert(schema.internshipApplications)
    .values({
      id: `app_${crypto.randomUUID()}`,
      programId: params.programId,
      cohortId: params.cohortId || null,
      userId,
      statement: params.statement.trim(),
      weeklyAvailabilityHours: params.weeklyAvailabilityHours,
      githubProfile: params.githubProfile.trim(),
      priorExperience: params.priorExperience.trim(),
      status: "pending",
    })
    .returning();

  return application;
}

/**
 * Reviews an internship application (admin/mentor only).
 * If accepted, automatically creates enrollment and issues cryptographic offer letter.
 */
export async function reviewApplication(
  reviewerId: string,
  applicationId: string,
  params: ReviewApplicationParams,
  database?: any
) {
  const db = database || (await getDb());

  const [application] = await db
    .select()
    .from(schema.internshipApplications)
    .where(eq(schema.internshipApplications.id, applicationId));

  if (!application) {
    throw new Error("Application not found");
  }

  const now = new Date();

  // Update application
  await db
    .update(schema.internshipApplications)
    .set({
      status: params.status,
      reviewedBy: reviewerId,
      reviewNotes: params.notes || null,
      reviewedAt: now,
    })
    .where(eq(schema.internshipApplications.id, applicationId));

  if (params.status === "accepted") {
    const [program] = await db
      .select()
      .from(schema.internshipPrograms)
      .where(eq(schema.internshipPrograms.id, application.programId));

    const [student] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, application.userId));

    let mentorUser = null;
    if (params.mentorId) {
      [mentorUser] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, params.mentorId));
    }

    const startDate = new Date();
    const targetEndDate = new Date();
    targetEndDate.setDate(targetEndDate.getDate() + program.durationWeeks * 7);

    // Generate Offer Letter
    const offerDoc = generateOfferLetter({
      studentId: student.id,
      studentUsername: student.githubUsername,
      studentDisplayName: student.displayName,
      programId: program.id,
      programTitle: program.title,
      programTrack: program.track,
      durationWeeks: program.durationWeeks,
      startDate,
      targetEndDate,
      mentorUsername: mentorUser?.githubUsername,
      mentorDisplayName: mentorUser?.displayName,
    });

    // Create or update enrollment
    const [existingEnrollment] = await db
      .select()
      .from(schema.internshipEnrollments)
      .where(
        and(
          eq(schema.internshipEnrollments.userId, student.id),
          eq(schema.internshipEnrollments.programId, program.id)
        )
      );

    if (existingEnrollment) {
      const [updated] = await db
        .update(schema.internshipEnrollments)
        .set({
          status: "active",
          mentorId: params.mentorId || existingEnrollment.mentorId,
          offerLetterId: offerDoc.offerId,
          offerHash: offerDoc.verificationHash,
          startDate,
          targetEndDate,
          updatedAt: now,
        })
        .where(eq(schema.internshipEnrollments.id, existingEnrollment.id))
        .returning();

      return { applicationStatus: "accepted", enrollment: updated, offerDoc };
    }

    const [enrollment] = await db
      .insert(schema.internshipEnrollments)
      .values({
        id: `ienr_${crypto.randomUUID()}`,
        programId: program.id,
        cohortId: application.cohortId,
        userId: student.id,
        mentorId: params.mentorId || null,
        offerLetterId: offerDoc.offerId,
        offerHash: offerDoc.verificationHash,
        status: "active",
        startDate,
        targetEndDate,
      })
      .returning();

    return { applicationStatus: "accepted", enrollment, offerDoc };
  }

  return { applicationStatus: "rejected" };
}

/**
 * Submits a weekly work log with pull request references.
 */
export async function submitWorkLog(
  userId: string,
  enrollmentId: string,
  params: SubmitWorkLogParams,
  database?: any
) {
  const db = database || (await getDb());

  const [enrollment] = await db
    .select()
    .from(schema.internshipEnrollments)
    .where(
      and(
        eq(schema.internshipEnrollments.id, enrollmentId),
        eq(schema.internshipEnrollments.userId, userId)
      )
    );

  if (!enrollment) {
    throw new Error("Active internship enrollment not found");
  }

  if (enrollment.status !== "active") {
    throw new Error(
      `Cannot submit work logs for an enrollment with status: ${enrollment.status}`
    );
  }

  if (!params.summary || params.summary.trim().length < 20) {
    throw new Error("Weekly summary must be at least 20 characters.");
  }

  if (params.hoursSpent <= 0 || params.hoursSpent > 60) {
    throw new Error("Hours spent must be between 1 and 60.");
  }

  // Validate PR URLs
  const prRegex = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/;
  for (const url of params.pullRequestUrls) {
    if (!prRegex.test(url.trim())) {
      throw new Error(`Invalid GitHub Pull Request URL: ${url}`);
    }
  }

  // Upsert work log for this weekNumber
  const [existingLog] = await db
    .select()
    .from(schema.internshipWorkLogs)
    .where(
      and(
        eq(schema.internshipWorkLogs.enrollmentId, enrollmentId),
        eq(schema.internshipWorkLogs.weekNumber, params.weekNumber)
      )
    );

  if (existingLog) {
    const [updated] = await db
      .update(schema.internshipWorkLogs)
      .set({
        hoursSpent: params.hoursSpent,
        summary: params.summary.trim(),
        pullRequestUrls: params.pullRequestUrls.map((u) => u.trim()),
        blockers: params.blockers?.trim() || null,
        submittedAt: new Date(),
      })
      .where(eq(schema.internshipWorkLogs.id, existingLog.id))
      .returning();

    return updated;
  }

  const [newLog] = await db
    .insert(schema.internshipWorkLogs)
    .values({
      id: `iwlg_${crypto.randomUUID()}`,
      enrollmentId,
      userId,
      weekNumber: params.weekNumber,
      hoursSpent: params.hoursSpent,
      summary: params.summary.trim(),
      pullRequestUrls: params.pullRequestUrls.map((u) => u.trim()),
      blockers: params.blockers?.trim() || null,
    })
    .returning();

  return newLog;
}

/**
 * Evaluates an intern's performance across 5 key dimensions (mentor only).
 */
export async function evaluateInternship(
  mentorId: string,
  enrollmentId: string,
  rubric: InternshipEvaluationRubric,
  database?: any
) {
  const db = database || (await getDb());

  const scores = [
    rubric.codeQualityScore,
    rubric.collaborationScore,
    rubric.punctualityScore,
    rubric.documentationScore,
    rubric.technicalInitiativeScore,
  ];

  for (const score of scores) {
    if (score < 1 || score > 5) {
      throw new Error("All rubric scores must be an integer between 1 and 5.");
    }
  }

  if (!rubric.overallFeedback || rubric.overallFeedback.trim().length < 30) {
    throw new Error(
      "Mentor evaluation requires detailed qualitative feedback of at least 30 characters."
    );
  }

  const [existingEval] = await db
    .select()
    .from(schema.internshipEvaluations)
    .where(eq(schema.internshipEvaluations.enrollmentId, enrollmentId));

  const now = new Date();

  if (existingEval) {
    await db
      .update(schema.internshipEvaluations)
      .set({
        mentorId,
        codeQualityScore: rubric.codeQualityScore,
        collaborationScore: rubric.collaborationScore,
        punctualityScore: rubric.punctualityScore,
        documentationScore: rubric.documentationScore,
        technicalInitiativeScore: rubric.technicalInitiativeScore,
        overallFeedback: rubric.overallFeedback.trim(),
        recommendCompletion: rubric.recommendCompletion,
        evaluatedAt: now,
      })
      .where(eq(schema.internshipEvaluations.id, existingEval.id));
  } else {
    await db.insert(schema.internshipEvaluations).values({
      id: `ieval_${crypto.randomUUID()}`,
      enrollmentId,
      mentorId,
      codeQualityScore: rubric.codeQualityScore,
      collaborationScore: rubric.collaborationScore,
      punctualityScore: rubric.punctualityScore,
      documentationScore: rubric.documentationScore,
      technicalInitiativeScore: rubric.technicalInitiativeScore,
      overallFeedback: rubric.overallFeedback.trim(),
      recommendCompletion: rubric.recommendCompletion,
      evaluatedAt: now,
    });
  }

  // If completion is recommended, update enrollment status
  if (rubric.recommendCompletion) {
    await db
      .update(schema.internshipEnrollments)
      .set({
        status: "completed",
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.internshipEnrollments.id, enrollmentId));
  }

  return { success: true, evaluatedAt: now };
}

/**
 * Fetches all active portal data for an intern (program, milestones, logs, mentor, evaluation).
 */
export async function getInternshipPortalData(userId: string, database?: any) {
  const db = database || (await getDb());

  const [enrollment] = await db
    .select()
    .from(schema.internshipEnrollments)
    .where(eq(schema.internshipEnrollments.userId, userId))
    .orderBy(desc(schema.internshipEnrollments.createdAt));

  if (!enrollment) {
    return null;
  }

  const [program] = await db
    .select()
    .from(schema.internshipPrograms)
    .where(eq(schema.internshipPrograms.id, enrollment.programId));

  let mentor = null;
  if (enrollment.mentorId) {
    const [m] = await db
      .select({
        id: schema.users.id,
        githubUsername: schema.users.githubUsername,
        displayName: schema.users.displayName,
        avatarUrl: schema.users.avatarUrl,
      })
      .from(schema.users)
      .where(eq(schema.users.id, enrollment.mentorId));
    mentor = m;
  }

  const milestones = await db
    .select()
    .from(schema.internshipMilestones)
    .where(eq(schema.internshipMilestones.programId, program.id))
    .orderBy(asc(schema.internshipMilestones.orderIndex));

  const workLogs = await db
    .select()
    .from(schema.internshipWorkLogs)
    .where(eq(schema.internshipWorkLogs.enrollmentId, enrollment.id))
    .orderBy(asc(schema.internshipWorkLogs.weekNumber));

  const [evaluation] = await db
    .select()
    .from(schema.internshipEvaluations)
    .where(eq(schema.internshipEvaluations.enrollmentId, enrollment.id));

  return {
    enrollment,
    program,
    mentor,
    milestones,
    workLogs,
    evaluation: evaluation || null,
  };
}
