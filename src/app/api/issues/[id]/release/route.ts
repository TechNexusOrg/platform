import { NextRequest, NextResponse } from "next/server";
import { getFreshAuthenticatedUser } from "@/lib/auth/authorization";
import { releaseIssueClaim } from "@/lib/issues/claims";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const freshUser = await getFreshAuthenticatedUser(request);
  if (!freshUser) {
    return NextResponse.json({ error: "Authentication required to release claim." }, { status: 401 });
  }

  const isAdmin = freshUser.role === "admin" || freshUser.role === "maintainer";

  const { id } = await params;

  try {
    const result = await releaseIssueClaim({
      issueId: id,
      userId: freshUser.id,
      isAdmin,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to release claim." },
      { status: 400 }
    );
  }
}
