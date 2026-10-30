import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { enrollInTrack } from "@/lib/learning/service";

const enrollSchema = z.object({
  trackId: z.string().min(1, "Track ID is required"),
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
    const { trackId } = enrollSchema.parse(body);

    const enrollment = await enrollInTrack(sessionUser.id, trackId);
    return NextResponse.json({ success: true, enrollment });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.flatten() },
        { status: 400 }
      );
    }

    console.error("Failed to enroll in track:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enroll in track" },
      { status: 500 }
    );
  }
}
