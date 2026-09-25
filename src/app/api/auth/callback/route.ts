import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, fetchGitHubUser, upsertGitHubUser } from "@/lib/auth/github";
import { createSessionToken, COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  const storedState = request.cookies.get("oauth_state")?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/?auth_error=Invalid+CSRF+state+parameter", request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?auth_error=Missing+authorization+code", request.url)
    );
  }

  try {
    const accessToken = await exchangeCodeForToken(code);
    const githubProfile = await fetchGitHubUser(accessToken);
    const sessionUser = await upsertGitHubUser(githubProfile);

    const token = await createSessionToken(sessionUser);

    const destination = sessionUser.isOnboarded ? "/dashboard" : "/onboarding";
    const response = NextResponse.redirect(new URL(destination, request.url));

    // Clear state cookie
    response.cookies.delete("oauth_state");

    // Set secure HTTP-only session cookie
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err: any) {
    console.error("Authentication callback error:", err);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(err.message || "Authentication failed")}`, request.url)
    );
  }
}
