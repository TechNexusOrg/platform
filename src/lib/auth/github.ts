import crypto from "crypto";
import { env } from "@/lib/env";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import type { SessionUser } from "./session";

export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getGitHubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${env.APP_URL}/api/auth/callback`,
    scope: "read:user user:email",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  blog: string | null;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
  if (data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || "Failed to retrieve access token");
  }

  return data.access_token;
}

export async function fetchGitHubUser(accessToken: string): Promise<GitHubUserProfile> {
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "TechNexusOrg-Platform",
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!userRes.ok) {
    throw new Error(`Failed to fetch GitHub profile: ${userRes.statusText}`);
  }

  const userData = (await userRes.json()) as GitHubUserProfile;

  // If email is private on profile, fetch primary verified email from /user/emails
  if (!userData.email) {
    try {
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "TechNexusOrg-Platform",
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (emailRes.ok) {
        const emails = (await emailRes.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;
        const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
        if (primary) {
          userData.email = primary.email;
        }
      }
    } catch {
      // Continue even if emails endpoint fails
    }
  }

  return userData;
}

export async function upsertGitHubUser(profile: GitHubUserProfile): Promise<SessionUser> {
  const db = await getDb();

  // Check if user already exists
  const existingUsers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.githubId, profile.id))
    .limit(1);

  if (existingUsers.length > 0) {
    const existing = existingUsers[0];
    // Update profile info
    await db
      .update(schema.users)
      .set({
        githubUsername: profile.login,
        displayName: profile.name || existing.displayName,
        email: profile.email || existing.email,
        avatarUrl: profile.avatar_url || existing.avatarUrl,
        bio: profile.bio || existing.bio,
        location: profile.location || existing.location,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, existing.id));

    return {
      id: existing.id,
      githubId: existing.githubId,
      githubUsername: profile.login,
      displayName: profile.name || existing.displayName,
      email: profile.email || existing.email,
      avatarUrl: profile.avatar_url || existing.avatarUrl,
      role: existing.role as "contributor" | "maintainer" | "admin",
      level: existing.level,
      isOnboarded: existing.isOnboarded,
      foundingNumber: existing.foundingNumber,
    };
  }

  // Create new user
  const userId = `usr_${crypto.randomUUID()}`;
  await db.insert(schema.users).values({
    id: userId,
    githubId: profile.id,
    githubUsername: profile.login,
    displayName: profile.name || profile.login,
    email: profile.email,
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    location: profile.location,
    portfolioUrl: profile.blog,
    role: "contributor",
    level: "explorer",
    isOnboarded: false,
  });

  // Create default profile record
  await db.insert(schema.profiles).values({
    id: `prof_${crypto.randomUUID()}`,
    userId,
    skills: [],
    interests: [],
    experienceLevel: "beginner",
    preferredLanguages: [],
    contributionPreferences: [],
  });

  return {
    id: userId,
    githubId: profile.id,
    githubUsername: profile.login,
    displayName: profile.name || profile.login,
    email: profile.email,
    avatarUrl: profile.avatar_url,
    role: "contributor",
    level: "explorer",
    isOnboarded: false,
    foundingNumber: null,
  };
}
