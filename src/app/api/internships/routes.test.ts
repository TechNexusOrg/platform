import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { GET as getProgramsHandler } from "./programs/route";
import { POST as applyHandler } from "./apply/route";
import { GET as getPortalHandler } from "./portal/route";
import { POST as submitWorkLogHandler } from "./work-logs/route";
import { listInternshipPrograms, reviewApplication } from "@/lib/internships/service";

describe("Internship API Routes", () => {
  let db: any;
  const testStudentId = `usr_api_intern_${Date.now()}`;
  const testMentorId = `usr_api_mentor_${Date.now()}`;
  let studentCookie: string;
  let enrollmentId: string;

  beforeAll(async () => {
    db = await getDb();
    await runMigrations();

    await db.insert(schema.users).values([
      {
        id: testStudentId,
        githubId: Math.floor(Math.random() * 1000000),
        githubUsername: "api_intern",
        email: "intern@technexus.org",
        role: "contributor",
      },
      {
        id: testMentorId,
        githubId: Math.floor(Math.random() * 1000000),
        githubUsername: "api_mentor",
        email: "mentor@technexus.org",
        role: "maintainer",
      },
    ]);

    const token = await createSessionToken({
      id: testStudentId,
      githubId: 123456,
      githubUsername: "api_intern",
      displayName: "API Intern",
      email: "intern@technexus.org",
      avatarUrl: null,
      role: "contributor",
      level: "builder",
      isOnboarded: true,
      foundingNumber: null,
    });

    studentCookie = `${COOKIE_NAME}=${token}`;
  });

  it("GET /api/internships/programs returns published programs", async () => {
    const res = await getProgramsHandler();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.programs).toBeDefined();
    expect(data.programs.length).toBeGreaterThanOrEqual(2);
  });

  it("POST /api/internships/apply submits an application", async () => {
    const programs = await listInternshipPrograms(db);
    const prog = programs[0];

    // Unauthorized request
    const unauthReq = new NextRequest("http://localhost:3000/api/internships/apply", {
      method: "POST",
      body: JSON.stringify({ programId: prog.id }),
    });
    const unauthRes = await applyHandler(unauthReq);
    expect(unauthRes.status).toBe(401);

    // Valid application
    const authReq = new NextRequest("http://localhost:3000/api/internships/apply", {
      method: "POST",
      headers: {
        cookie: studentCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        programId: prog.id,
        statement:
          "I am excited to build real backend features for TechNexusOrg and participate in code reviews.",
        weeklyAvailabilityHours: 15,
        githubProfile: "https://github.com/api_intern",
        priorExperience: "Strong experience with TypeScript, Next.js, and SQL.",
      }),
    });

    const res = await applyHandler(authReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.application.status).toBe("pending");

    // Review and accept application to create active enrollment
    const reviewResult = await reviewApplication(
      testMentorId,
      data.application.id,
      {
        status: "accepted",
        mentorId: testMentorId,
      },
      db
    );
    enrollmentId = reviewResult.enrollment!.id;
  });

  it("GET /api/internships/portal returns active enrollment details", async () => {
    const req = new NextRequest("http://localhost:3000/api/internships/portal", {
      headers: { cookie: studentCookie },
    });

    const res = await getPortalHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.portalData).toBeDefined();
    expect(data.portalData.enrollment.id).toBe(enrollmentId);
    expect(data.portalData.program).toBeDefined();
  });

  it("POST /api/internships/work-logs submits weekly work logs", async () => {
    const req = new NextRequest("http://localhost:3000/api/internships/work-logs", {
      method: "POST",
      headers: {
        cookie: studentCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        enrollmentId,
        weekNumber: 1,
        hoursSpent: 15,
        summary: "Created unit tests and updated API route schema for issues.",
        pullRequestUrls: ["https://github.com/TechNexusOrg/platform/pull/16"],
        blockers: "None",
      }),
    });

    const res = await submitWorkLogHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.workLog.weekNumber).toBe(1);
    expect(data.workLog.hoursSpent).toBe(15);
  });
});
