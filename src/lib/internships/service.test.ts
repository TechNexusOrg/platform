import { describe, it, expect, beforeAll } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { eq } from "drizzle-orm";
import {
  seedPilotInternships,
  listInternshipPrograms,
  applyForInternship,
  reviewApplication,
  submitWorkLog,
  evaluateInternship,
  getInternshipPortalData,
} from "./service";
import { computeOfferHash, generateOfferLetter } from "./offer-letter";

describe("Internship & Cohort Management System", () => {
  let db: any;
  const studentId = `usr_student_${Date.now()}`;
  const mentorId = `usr_mentor_${Date.now()}`;

  beforeAll(async () => {
    db = await getDb();
    await runMigrations();

    // Create student and mentor users
    await db.insert(schema.users).values([
      {
        id: studentId,
        githubId: Math.floor(Math.random() * 1000000),
        githubUsername: "student_fellow",
        displayName: "Student Fellow",
        email: "fellow@technexus.org",
        role: "contributor",
      },
      {
        id: mentorId,
        githubId: Math.floor(Math.random() * 1000000),
        githubUsername: "lead_mentor",
        displayName: "Lead Mentor",
        email: "mentor@technexus.org",
        role: "maintainer",
      },
    ]);
  });

  it("computes deterministic SHA-256 verification hash for offer letter", () => {
    const params = {
      studentId: "usr_123",
      studentUsername: "alex",
      programId: "prog_456",
      programTitle: "Systems Fellowship",
      programTrack: "systems",
      durationWeeks: 8,
      startDate: new Date("2026-11-01T00:00:00Z"),
      targetEndDate: new Date("2026-12-27T00:00:00Z"),
    };

    const hash1 = computeOfferHash(params);
    const hash2 = computeOfferHash(params);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);

    const doc = generateOfferLetter(params);
    expect(doc.offerId).toMatch(/^tn-off-/);
    expect(doc.verificationHash).toBe(hash1);
    expect(doc.terms.length).toBeGreaterThanOrEqual(4);
  });

  it("seeds pilot internship programs and cohorts idempotently", async () => {
    await seedPilotInternships(db);

    const programs = await listInternshipPrograms(db);
    expect(programs.length).toBeGreaterThanOrEqual(2);

    const platformProg = programs.find((p) => p.slug === "platform-engineering");
    expect(platformProg).toBeDefined();
    expect(platformProg!.durationWeeks).toBe(8);
    expect(platformProg!.milestones.length).toBe(4);
    expect(platformProg!.cohorts.length).toBeGreaterThanOrEqual(1);
  });

  it("submits application and enforces validation rules", async () => {
    const programs = await listInternshipPrograms(db);
    const prog = programs[0];

    // Reject short statement
    await expect(
      applyForInternship(
        studentId,
        {
          programId: prog.id,
          statement: "Too short",
          weeklyAvailabilityHours: 15,
          githubProfile: "https://github.com/student_fellow",
          priorExperience: "None",
        },
        db
      )
    ).rejects.toThrow("Statement of purpose must be at least 50 characters");

    // Reject low availability
    await expect(
      applyForInternship(
        studentId,
        {
          programId: prog.id,
          statement:
            "I want to deeply understand systems architecture and contribute real code to open source.",
          weeklyAvailabilityHours: 5,
          githubProfile: "https://github.com/student_fellow",
          priorExperience: "None",
        },
        db
      )
    ).rejects.toThrow("Fellowship requires a minimum commitment of 10 hours");

    // Valid submission
    const application = await applyForInternship(
      studentId,
      {
        programId: prog.id,
        statement:
          "I am committed to mastering platform engineering, asynchronous queues, and building robust open-source systems.",
        weeklyAvailabilityHours: 15,
        githubProfile: "https://github.com/student_fellow",
        priorExperience: "Built basic HTTP servers and CLI tools in Go.",
      },
      db
    );

    expect(application).toBeDefined();
    expect(application.status).toBe("pending");

    // Reject duplicate pending application
    await expect(
      applyForInternship(
        studentId,
        {
          programId: prog.id,
          statement:
            "I am committed to mastering platform engineering, asynchronous queues, and building robust open-source systems.",
          weeklyAvailabilityHours: 15,
          githubProfile: "https://github.com/student_fellow",
          priorExperience: "Built basic HTTP servers and CLI tools in Go.",
        },
        db
      )
    ).rejects.toThrow("already have a pending application");
  });

  it("reviews application, creates active enrollment, and issues offer letter", async () => {
    const [app] = await db
      .select()
      .from(schema.internshipApplications)
      .where(eq(schema.internshipApplications.userId, studentId));

    const result = await reviewApplication(
      mentorId,
      app.id,
      {
        status: "accepted",
        mentorId: mentorId,
        notes: "Solid motivation and practical alignment.",
      },
      db
    );

    expect(result.applicationStatus).toBe("accepted");
    expect(result.enrollment).toBeDefined();
    expect(result.enrollment!.status).toBe("active");
    expect(result.offerDoc).toBeDefined();
    expect(result.offerDoc!.verificationHash.length).toBe(64);
  });

  it("submits weekly work logs with verified PR links", async () => {
    const portalData = await getInternshipPortalData(studentId, db);
    expect(portalData).toBeDefined();
    const enrollment = portalData!.enrollment;

    // Reject invalid PR URL
    await expect(
      submitWorkLog(
        studentId,
        enrollment.id,
        {
          weekNumber: 1,
          hoursSpent: 12,
          summary: "Triage and resolved memory leak issue in sync engine.",
          pullRequestUrls: ["https://example.com/not-a-pr"],
        },
        db
      )
    ).rejects.toThrow("Invalid GitHub Pull Request URL");

    // Valid work log submission
    const log = await submitWorkLog(
      studentId,
      enrollment.id,
      {
        weekNumber: 1,
        hoursSpent: 14,
        summary: "Investigated POSIX file lock contention and authored unit tests.",
        pullRequestUrls: [
          "https://github.com/TechNexusOrg/platform/pull/12",
          "https://github.com/TechNexusOrg/platform/pull/14",
        ],
        blockers: "None encountered.",
      },
      db
    );

    expect(log).toBeDefined();
    expect(log.weekNumber).toBe(1);
    expect(log.hoursSpent).toBe(14);
  });

  it("evaluates intern using structured rubric and marks completion", async () => {
    const portalData = await getInternshipPortalData(studentId, db);
    const enrollment = portalData!.enrollment;

    // Reject invalid rubric score (< 1 or > 5)
    await expect(
      evaluateInternship(
        mentorId,
        enrollment.id,
        {
          codeQualityScore: 6, // Invalid
          collaborationScore: 4,
          punctualityScore: 5,
          documentationScore: 4,
          technicalInitiativeScore: 5,
          overallFeedback: "Exceeded all expectations on backend systems tasks.",
          recommendCompletion: true,
        },
        db
      )
    ).rejects.toThrow("All rubric scores must be an integer between 1 and 5");

    // Valid evaluation with recommendation for completion
    const evalResult = await evaluateInternship(
      mentorId,
      enrollment.id,
      {
        codeQualityScore: 5,
        collaborationScore: 5,
        punctualityScore: 4,
        documentationScore: 4,
        technicalInitiativeScore: 5,
        overallFeedback:
          "Demonstrated exceptional engineering maturity, thorough testing, and clean commit hygiene throughout the 8 weeks.",
        recommendCompletion: true,
      },
      db
    );

    expect(evalResult.success).toBe(true);

    // Verify enrollment transitioned to completed
    const updatedPortal = await getInternshipPortalData(studentId, db);
    expect(updatedPortal!.enrollment.status).toBe("completed");
    expect(updatedPortal!.enrollment.completedAt).not.toBeNull();
    expect(updatedPortal!.evaluation).toBeDefined();
    expect(updatedPortal!.evaluation!.codeQualityScore).toBe(5);
  });
});
