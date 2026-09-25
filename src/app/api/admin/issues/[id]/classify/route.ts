import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/authorization";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const classifySchema = z.object({
  difficulty: z.enum(["unclassified", "beginner", "intermediate", "advanced"]),
  estimatedEffort: z.string().optional(),
  isGoodFirstIssue: z.boolean().optional(),
  isHelpWanted: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    // Fresh DB check for admin/maintainer
    await requireRole(session.id, ["admin", "maintainer"]);

    const body = await request.json();
    const validated = classifySchema.parse(body);

    const db = await getDb();
    const [updated] = await db
      .update(schema.issues)
      .set({
        difficulty: validated.difficulty,
        estimatedEffort: validated.estimatedEffort || null,
        isGoodFirstIssue: validated.isGoodFirstIssue ?? false,
        isHelpWanted: validated.isHelpWanted ?? false,
        updatedAt: new Date(),
      })
      .where(eq(schema.issues.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, issue: updated });
  } catch (err: any) {
    const status = err.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
