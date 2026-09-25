import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

export interface SessionUser {
  id: string;
  githubId: number;
  githubUsername: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: "contributor" | "maintainer" | "admin";
  level: string;
  isOnboarded: boolean;
  foundingNumber: number | null;
}

const COOKIE_NAME = "technexus_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      id: payload.id as string,
      githubId: payload.githubId as number,
      githubUsername: payload.githubUsername as string,
      displayName: (payload.displayName as string) || null,
      email: (payload.email as string) || null,
      avatarUrl: (payload.avatarUrl as string) || null,
      role: (payload.role as "contributor" | "maintainer" | "admin") || "contributor",
      level: (payload.level as string) || "explorer",
      isOnboarded: Boolean(payload.isOnboarded),
      foundingNumber: (payload.foundingNumber as number) || null,
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
