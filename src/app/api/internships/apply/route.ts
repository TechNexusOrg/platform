import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { applyForInternship } from "@/lib/internships/service";

const applicationSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
  cohortId: z.string().optional(),
  statement: z
    .string()
    .min(50, "Statement of purpose must be at least 50 characters"),
  weeklyAvailabilityHours: z
    .number()
    .min(10, "Minimum 10 hours per week required")
    .max(60),
  githubProfile: z.string().url("Valid GitHub profile URL required"),
  priorExperience: z.string().min(1, "Prior experience description required"),
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
    const data = applicationSchema.parse(body);

    const application = await applyForInternship(sessionUser.id, data);
    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid application data", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to submit application" },
      { status: 400 }
    );
  }
}
