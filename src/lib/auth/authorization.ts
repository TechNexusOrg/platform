import { NextRequest } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "./session";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export interface AuthenticatedUserRecord {
  id: string;
  githubId: number;
  githubUsername: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string; // fresh from DB: "contributor" | "maintainer" | "admin"
  level: string; // fresh from DB
  isOnboarded: boolean;
  isPublic: boolean;
  foundingNumber: number | null;
}

/**
 * Validates session token and fetches the fresh user record from the database.
 * Never relies on stale JWT role/level claims for privileged operations.
 */
export async function getFreshAuthenticatedUser(
  request: NextRequest | { cookies: { get: (name: string) => { value: string } | undefined } }
): Promise<AuthenticatedUserRecord | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);
  if (!session || !session.id) {
    return null;
  }

  const db = await getDb();
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.id))
    .limit(1);

  if (users.length === 0) {
    return null;
  }

  return users[0] as AuthenticatedUserRecord;
}

/**
 * Checks whether the fresh authenticated user has one of the allowed roles.
 */
export function hasRole(
  user: AuthenticatedUserRecord | null,
  allowedRoles: string[]
): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Enforces authorization by checking the fresh user record from the database for userId.
 * Throws an Error if user is not found or lacks the required role.
 */
export async function requireRole(
  userId: string,
  allowedRoles: string[]
): Promise<AuthenticatedUserRecord> {
  const db = await getDb();
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (users.length === 0) {
    throw new Error("Unauthorized: user not found");
  }

  const user = users[0] as AuthenticatedUserRecord;
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: insufficient permissions");
  }

  return user;
}
