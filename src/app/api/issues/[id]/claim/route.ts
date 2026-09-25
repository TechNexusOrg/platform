import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { claimIssue } from "@/lib/issues/claims";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Authentication required to claim issues." }, { status: 401 });
  }

  const sessionUser = await verifySessionToken(token);
  if (!sessionUser) {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await claimIssue({
      issueId: id,
      userId: sessionUser.id,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to claim issue." },
      { status: 400 }
    );
  }
}
