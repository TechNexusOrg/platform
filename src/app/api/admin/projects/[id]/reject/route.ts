import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/authorization";
import { rejectProject } from "@/lib/projects/approval";

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
    // Fresh server-side DB check for admin/maintainer
    await requireRole(session.id, ["admin", "maintainer"]);

    const rejected = await rejectProject(id, session.id);

    return NextResponse.json({
      success: true,
      project: rejected,
    });
  } catch (err: any) {
    const status = err.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
