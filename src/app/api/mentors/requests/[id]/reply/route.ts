import { NextRequest, NextResponse } from "next/server";
import { getFreshAuthenticatedUser } from "@/lib/auth/authorization";
import { replyMentorRequest } from "@/lib/mentorship/service";
import { z } from "zod";

const replySchema = z.object({
  reply: z.string().min(2, "Reply cannot be empty"),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).default("in_progress"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const freshUser = await getFreshAuthenticatedUser(request);
  if (!freshUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isMentorOrAdmin = freshUser.role === "admin" || freshUser.role === "maintainer";
  if (!isMentorOrAdmin) {
    return NextResponse.json(
      { error: "Only mentors or maintainers can reply to mentorship requests." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = replySchema.parse(body);

    const updated = await replyMentorRequest({
      requestId: id,
      mentorId: freshUser.id,
      reply: validated.reply,
      status: validated.status,
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to reply to mentor request" },
      { status: 400 }
    );
  }
}
