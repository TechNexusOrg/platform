import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { listTracks } from "@/lib/learning/service";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    let userId: string | undefined;

    if (token) {
      const sessionUser = await verifySessionToken(token);
      if (sessionUser) {
        userId = sessionUser.id;
      }
    }

    const tracks = await listTracks({ userId, publishedOnly: true });
    return NextResponse.json({ tracks });
  } catch (error: any) {
    console.error("Failed to list learning tracks:", error);
    return NextResponse.json(
      { error: "Failed to list learning tracks", details: error.message },
      { status: 500 }
    );
  }
}
