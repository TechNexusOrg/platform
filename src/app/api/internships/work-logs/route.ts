import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { submitWorkLog } from "@/lib/internships/service";

const workLogSchema = z.object({
  enrollmentId: z.string().min(1, "Enrollment ID is required"),
  weekNumber: z.number().int().min(1).max(20),
  hoursSpent: z.number().int().min(1).max(60),
  summary: z.string().min(20, "Summary must be at least 20 characters"),
  pullRequestUrls: z.array(z.string().url()).min(1, "At least 1 PR URL is required"),
  blockers: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionUser = await verifySessionToken(token);
  if (!sessionUser) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = workLogSchema.parse(body);

    const log = await submitWorkLog(sessionUser.id, data.enrollmentId, {
      weekNumber: data.weekNumber,
      hoursSpent: data.hoursSpent,
      summary: data.summary,
      pullRequestUrls: data.pullRequestUrls,
      blockers: data.blockers,
    });

    return NextResponse.json({ success: true, workLog: log });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid work log data", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to submit work log" },
      { status: 400 }
    );
  }
}
