import { describe, it, expect, beforeAll } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import {
  seedPilotCurriculum,
  listTracks,
  getTrackBySlug,
  getLesson,
  enrollInTrack,
  toggleLessonProgress,
  submitAssignment,
} from "./service";

describe("Learning Platform Service", () => {
  let db: any;
  const testUserId = `usr_test_${Date.now()}`;

  beforeAll(async () => {
    db = await getDb();
    await runMigrations();

    // Create a mock user in database for foreign key constraints
    await db.insert(schema.users).values({
      id: testUserId,
      githubId: Math.floor(Math.random() * 1000000),
      githubUsername: "teststudent",
      email: "teststudent@technexus.org",
      role: "contributor",
    });
  });

  it("seeds pilot curriculum idempotently", async () => {
    await seedPilotCurriculum(db);

    const tracks = await db.select().from(schema.learningTracks);
    expect(tracks.length).toBeGreaterThanOrEqual(2);

    const linuxTrack = tracks.find((t: any) => t.slug === "linux-fundamentals");
    expect(linuxTrack).toBeDefined();
    expect(linuxTrack.title).toBe("Linux Fundamentals and Administration");

    const gitTrack = tracks.find((t: any) => t.slug === "git-open-source");
    expect(gitTrack).toBeDefined();
    expect(gitTrack.title).toBe("Git and Professional Open-Source Development");

    // Second run should not throw and should not duplicate tracks
    await seedPilotCurriculum(db);
    const tracksAfter = await db.select().from(schema.learningTracks);
    expect(tracksAfter.length).toBe(tracks.length);
  });

  it("lists published tracks with accurate module and lesson counts", async () => {
    const trackList = await listTracks({ userId: testUserId }, db);
    expect(trackList.length).toBeGreaterThanOrEqual(2);

    const linux = trackList.find((t) => t.slug === "linux-fundamentals");
    expect(linux).toBeDefined();
    expect(linux!.moduleCount).toBe(3);
    expect(linux!.lessonCount).toBe(6);
    expect(linux!.progressPercentage).toBe(0);
    expect(linux!.enrollmentStatus).toBeNull();
  });

  it("fetches detailed track syllabus by slug", async () => {
    const track = await getTrackBySlug("linux-fundamentals", testUserId, db);
    expect(track).toBeDefined();
    expect(track!.slug).toBe("linux-fundamentals");
    expect(track!.modules.length).toBe(3);

    const firstModule = track!.modules[0];
    expect(firstModule.slug).toBe("sys-navigation-basics");
    expect(firstModule.lessons.length).toBe(2);

    const firstLesson = firstModule.lessons[0];
    expect(firstLesson.slug).toBe("posix-shell-hierarchy");
    expect(firstLesson.isCompleted).toBe(false);
  });

  it("enrolls a user into a track", async () => {
    const track = await getTrackBySlug("linux-fundamentals", testUserId, db);
    expect(track).toBeDefined();

    const enrollment = await enrollInTrack(testUserId, track!.id, db);
    expect(enrollment).toBeDefined();
    expect(enrollment.status).toBe("enrolled");

    // Re-enrolling should return existing record idempotently
    const secondEnrollment = await enrollInTrack(testUserId, track!.id, db);
    expect(secondEnrollment.id).toBe(enrollment.id);
  });

  it("retrieves a detailed lesson with navigation and assignment info", async () => {
    const lesson = await getLesson(
      "linux-fundamentals",
      "posix-shell-hierarchy",
      testUserId,
      db
    );

    expect(lesson).toBeDefined();
    expect(lesson!.slug).toBe("posix-shell-hierarchy");
    expect(lesson!.content).toContain("POSIX Shell Environment");
    expect(lesson!.module.slug).toBe("sys-navigation-basics");
    expect(lesson!.track.slug).toBe("linux-fundamentals");
    expect(lesson!.previousLesson).toBeNull();
    expect(lesson!.nextLesson).toEqual({
      slug: "file-permissions-security",
      title: "File Permissions, Ownership, and Security",
    });
  });

  it("toggles lesson completion and updates track progress percentage", async () => {
    const track = await getTrackBySlug("linux-fundamentals", testUserId, db);
    const firstLesson = track!.modules[0].lessons[0];

    // Mark first lesson complete
    const progressResult = await toggleLessonProgress(
      testUserId,
      firstLesson.id,
      true,
      db
    );

    expect(progressResult.completed).toBe(true);
    expect(progressResult.completedLessons).toBe(1);
    expect(progressResult.progressPercentage).toBe(17); // 1 of 6 is ~17%
    expect(progressResult.trackStatus).toBe("in_progress");

    // Verify track reflects progress
    const updatedTrack = await getTrackBySlug(
      "linux-fundamentals",
      testUserId,
      db
    );
    expect(updatedTrack!.progressPercentage).toBe(17);
    expect(updatedTrack!.enrollmentStatus).toBe("in_progress");
    expect(updatedTrack!.modules[0].lessons[0].isCompleted).toBe(true);

    // Unmark lesson complete
    const unmarkResult = await toggleLessonProgress(
      testUserId,
      firstLesson.id,
      false,
      db
    );
    expect(unmarkResult.completed).toBe(false);
    expect(unmarkResult.completedLessons).toBe(0);
    expect(unmarkResult.progressPercentage).toBe(0);
    expect(unmarkResult.trackStatus).toBe("enrolled");
  });

  it("submits an assignment and validates submission types", async () => {
    // Lesson 6 in Linux Fundamentals has a terminal_output assignment
    const lessonWithAssignment = await getLesson(
      "linux-fundamentals",
      "systemd-services-journald",
      testUserId,
      db
    );

    expect(lessonWithAssignment).toBeDefined();
    expect(lessonWithAssignment!.assignment).toBeDefined();
    const assignment = lessonWithAssignment!.assignment!;

    // Test rejection of empty content
    await expect(
      submitAssignment(testUserId, assignment.id, "   ", db)
    ).rejects.toThrow("Submission content cannot be empty");

    // Successful terminal output submission
    const submission = await submitAssignment(
      testUserId,
      assignment.id,
      "● health-monitor.service - TechNexus Health Monitor\n   Active: active (running)",
      db
    );

    expect(submission.status).toBe("submitted");
    expect(submission.content).toContain("Active: active (running)");

    // Test GitHub PR URL assignment validation in Git track
    const gitLessonWithAssignment = await getLesson(
      "git-open-source",
      "github-actions-ci-integration",
      testUserId,
      db
    );

    expect(gitLessonWithAssignment).toBeDefined();
    const gitAssignment = gitLessonWithAssignment!.assignment!;

    // Reject non-GitHub PR URL
    await expect(
      submitAssignment(testUserId, gitAssignment.id, "https://google.com", db)
    ).rejects.toThrow("Invalid GitHub PR URL");

    // Accept valid GitHub PR URL
    const prSubmission = await submitAssignment(
      testUserId,
      gitAssignment.id,
      "https://github.com/TechNexusOrg/platform/pull/12",
      db
    );

    expect(prSubmission.status).toBe("submitted");
    expect(prSubmission.content).toBe(
      "https://github.com/TechNexusOrg/platform/pull/12"
    );
  });
});
