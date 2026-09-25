import { describe, it, expect, beforeAll } from "vitest";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import {
  createMentorRequest,
  getMentorRequestsForUser,
  replyMentorRequest,
} from "./service";
import { eq } from "drizzle-orm";

describe("Mentorship Service", () => {
  const studentId = "usr_mentor_student_01";
  const mentorId = "usr_mentor_lead_01";
  const projectId = "proj_mentor_test_repo";
  const issueId = "iss_mentor_test_issue";

  beforeAll(async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    await runMigrations();
    const db = await getDb();

    // 1. Seed users
    await db.insert(schema.users).values([
      {
        id: studentId,
        githubId: 554433,
        githubUsername: "learner_dan",
        role: "contributor",
        level: "level_1",
        isOnboarded: true,
      },
      {
        id: mentorId,
        githubId: 554434,
        githubUsername: "mentor_sarah",
        role: "maintainer",
        level: "level_5",
        isOnboarded: true,
      },
    ]);

    // 2. Seed project
    await db.insert(schema.projects).values({
      id: projectId,
      name: "mentor-test-repo",
      slug: "mentor-test-repo",
      githubRepo: "TechNexusOrg/mentor-test-repo",
      description: "Test repo for mentorship requests",
      primaryLanguage: "TypeScript",
      contributionEnabled: true,
    });

    // 3. Seed issue
    await db.insert(schema.issues).values({
      id: issueId,
      projectId,
      githubIssueId: 88891,
      githubIssueNumber: 5,
      title: "Set up test container",
      state: "open",
      htmlUrl: "https://github.com/TechNexusOrg/mentor-test-repo/issues/5",
      difficulty: "beginner",
    });
  });

  it("submits assistance request with open status", async () => {
    const req = await createMentorRequest({
      studentId,
      issueId,
      message: "Need guidance on setting up local Docker container for tests",
    });

    expect(req).toBeDefined();
    expect(req.status).toBe("open");
    expect(req.studentId).toBe(studentId);
    expect(req.issueId).toBe(issueId);
  });

  it("lists open requests for mentors", async () => {
    const requests = await getMentorRequestsForUser(mentorId, true);
    expect(requests.length).toBeGreaterThanOrEqual(1);
    expect(requests[0].studentId).toBe(studentId);
  });

  it("allows mentor to reply and sends notification to student", async () => {
    const db = await getDb();
    const requests = await getMentorRequestsForUser(mentorId, true);
    const target = requests[0];

    const updated = await replyMentorRequest({
      requestId: target.id,
      mentorId,
      reply: "Check out the scripts/setup-docker.sh script in the root directory!",
      status: "resolved",
    });

    expect(updated.status).toBe("resolved");
    expect(updated.mentorId).toBe(mentorId);
    expect(updated.reply).toContain("setup-docker.sh");

    // Check notification was sent to student
    const notifs = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, studentId));

    expect(notifs.length).toBeGreaterThanOrEqual(1);
    expect(notifs[0].title).toBe("Mentor Responded");
  });
});
