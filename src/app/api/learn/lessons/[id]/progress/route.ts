import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { toggleLessonProgress } from "@/lib/learning/service";

const progressSchema = z.object({
  completed: z.boolean(),
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
    const { id: lessonId } = await params;
    const body = await request.json();
    const { completed } = progressSchema.parse(body);

    const result = await toggleLessonProgress(
      sessionUser.id,
      lessonId,
      completed
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Failed to update lesson progress:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update lesson progress" },
      { status: 500 }
    );
  }
}
