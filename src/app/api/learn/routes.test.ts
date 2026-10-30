import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { GET as getTracksHandler } from "./tracks/route";
import { POST as enrollHandler } from "./enroll/route";
import { POST as progressHandler } from "./lessons/[id]/progress/route";
import { POST as submitAssignmentHandler } from "./assignments/[id]/submit/route";
import { getTrackBySlug } from "@/lib/learning/service";

describe("Learning Platform API Routes", () => {
  let db: any;
  const testUserId = `usr_api_student_${Date.now()}`;
  let sessionCookie: string;

  beforeAll(async () => {
    db = await getDb();
    await runMigrations();

    await db.insert(schema.users).values({
      id: testUserId,
      githubId: Math.floor(Math.random() * 1000000),
      githubUsername: "apistudent",
      email: "apistudent@technexus.org",
      role: "contributor",
    });

    const token = await createSessionToken({
      id: testUserId,
      githubId: 123456,
      githubUsername: "apistudent",
      displayName: "API Student",
      email: "apistudent@technexus.org",
      avatarUrl: null,
      role: "contributor",
      level: "explorer",
      isOnboarded: true,
      foundingNumber: null,
    });

    sessionCookie = `${COOKIE_NAME}=${token}`;
  });

  it("GET /api/learn/tracks returns published tracks", async () => {
    const req = new NextRequest("http://localhost:3000/api/learn/tracks", {
      headers: { cookie: sessionCookie },
    });

    const res = await getTracksHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.tracks).toBeDefined();
    expect(data.tracks.length).toBeGreaterThanOrEqual(2);
  });

  it("POST /api/learn/enroll enrolls logged-in student in track", async () => {
    const track = await getTrackBySlug("linux-fundamentals", testUserId, db);
    expect(track).toBeDefined();

    // Unauthorized without cookie
    const unauthReq = new NextRequest("http://localhost:3000/api/learn/enroll", {
      method: "POST",
      body: JSON.stringify({ trackId: track!.id }),
    });
    const unauthRes = await enrollHandler(unauthReq);
    expect(unauthRes.status).toBe(401);

    // Authorized enrollment
    const authReq = new NextRequest("http://localhost:3000/api/learn/enroll", {
      method: "POST",
      headers: {
        cookie: sessionCookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ trackId: track!.id }),
    });

    const authRes = await enrollHandler(authReq);
    expect(authRes.status).toBe(200);
    const data = await authRes.json();
    expect(data.success).toBe(true);
    expect(data.enrollment.trackId).toBe(track!.id);
  });

  it("POST /api/learn/lessons/[id]/progress updates completion status", async () => {
    const track = await getTrackBySlug("linux-fundamentals", testUserId, db);
    const lesson = track!.modules[0].lessons[0];

    const req = new NextRequest(
      `http://localhost:3000/api/learn/lessons/${lesson.id}/progress`,
      {
        method: "POST",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: JSON.stringify({ completed: true }),
      }
    );

    const res = await progressHandler(req, {
      params: Promise.resolve({ id: lesson.id }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.completed).toBe(true);
    expect(data.completedLessons).toBeGreaterThanOrEqual(1);
  });

  it("POST /api/learn/assignments/[id]/submit handles submissions with validation", async () => {
    const track = await getTrackBySlug("git-open-source", testUserId, db);
    const lastModule = track!.modules[track!.modules.length - 1];
    const lastLesson = lastModule.lessons[lastModule.lessons.length - 1];

    const [assignment] = await db
      .select()
      .from(schema.learningAssignments)
      .where(eq(schema.learningAssignments.lessonId, lastLesson.id));

    expect(assignment).toBeDefined();

    // Invalid PR URL should return 400
    const invalidReq = new NextRequest(
      `http://localhost:3000/api/learn/assignments/${assignment.id}/submit`,
      {
        method: "POST",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: JSON.stringify({ content: "not-a-pr-url" }),
      }
    );

    const invalidRes = await submitAssignmentHandler(invalidReq, {
      params: Promise.resolve({ id: assignment.id }),
    });
    expect(invalidRes.status).toBe(400);

    // Valid PR URL should return 200
    const validReq = new NextRequest(
      `http://localhost:3000/api/learn/assignments/${assignment.id}/submit`,
      {
        method: "POST",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          content: "https://github.com/TechNexusOrg/platform/pull/15",
        }),
      }
    );

    const validRes = await submitAssignmentHandler(validReq, {
      params: Promise.resolve({ id: assignment.id }),
    });
    expect(validRes.status).toBe(200);
    const validData = await validRes.json();
    expect(validData.success).toBe(true);
    expect(validData.submission.content).toBe(
      "https://github.com/TechNexusOrg/platform/pull/15"
    );
  });
});
