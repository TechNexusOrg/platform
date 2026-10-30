import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getInternshipPortalData } from "@/lib/internships/service";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionUser = await verifySessionToken(token);
  if (!sessionUser) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    const portalData = await getInternshipPortalData(sessionUser.id);
    return NextResponse.json({ portalData });
  } catch (error: any) {
    console.error("Failed to load internship portal data:", error);
    return NextResponse.json(
      { error: "Failed to load portal data", details: error.message },
      { status: 500 }
    );
  }
}
