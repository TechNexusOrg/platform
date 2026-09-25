import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getFreshAuthenticatedUser } from "@/lib/auth/authorization";
import { createMentorRequest, getMentorRequestsForUser } from "@/lib/mentorship/service";
import { z } from "zod";

const createRequestSchema = z.object({
  message: z.string().min(5, "Message must be at least 5 characters"),
  issueId: z.string().min(1, "Valid issue ID is required"),
  mentorId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const freshUser = await getFreshAuthenticatedUser(request);
  if (!freshUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isMaintainer = freshUser.role === "admin" || freshUser.role === "maintainer";

  try {
    const requests = await getMentorRequestsForUser(freshUser.id, isMaintainer);
    return NextResponse.json({ requests });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createRequestSchema.parse(body);

    const mentorRequest = await createMentorRequest({
      studentId: session.id,
      message: validated.message,
      issueId: validated.issueId,
      mentorId: validated.mentorId,
    });

    return NextResponse.json({ success: true, request: mentorRequest });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create mentor request" },
      { status: 400 }
    );
  }
}
