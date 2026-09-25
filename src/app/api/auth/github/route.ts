import { NextResponse } from "next/server";
import { generateOAuthState, getGitHubAuthUrl } from "@/lib/auth/github";

export async function GET() {
  const state = generateOAuthState();
  const authUrl = getGitHubAuthUrl(state);

  const response = NextResponse.redirect(authUrl);

  // Set CSRF state cookie (HttpOnly, SameSite Lax, 10 min expiry)
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
