import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { syncUserContributions } from "@/lib/github/contributions";

export async function POST() {
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
    const result = await syncUserContributions(session.id);
    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error: any) {
    console.error("Contributions sync failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to sync contributions" },
      { status: 500 }
    );
  }
}
