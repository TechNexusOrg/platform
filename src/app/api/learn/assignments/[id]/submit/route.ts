import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { submitAssignment } from "@/lib/learning/service";

const submissionSchema = z.object({
  content: z.string().min(1, "Submission content is required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionUser = await verifySessionToken(token);
  if (!sessionUser) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    const { id: assignmentId } = await params;
    const body = await request.json();
    const { content } = submissionSchema.parse(body);

    const submission = await submitAssignment(
      sessionUser.id,
      assignmentId,
      content
    );

    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to submit assignment" },
      { status: 400 }
    );
  }
}
