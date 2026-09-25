import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionToken, createSessionToken, COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const onboardingSchema = z.object({
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  interests: z.array(z.string()).min(1, "Select at least one area of interest"),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  preferredLanguages: z.array(z.string()).default([]),
  contributionPreferences: z.array(z.string()).default([]),
});

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionUser = await verifySessionToken(token);
  if (!sessionUser) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = onboardingSchema.parse(body);

    const db = await getDb();

    // Upsert profile
    const existingProfile = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, sessionUser.id))
      .limit(1);

    if (existingProfile.length > 0) {
      await db
        .update(schema.profiles)
        .set({
          skills: validated.skills,
          interests: validated.interests,
          experienceLevel: validated.experienceLevel,
          preferredLanguages: validated.preferredLanguages,
          contributionPreferences: validated.contributionPreferences,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.userId, sessionUser.id));
    } else {
      await db.insert(schema.profiles).values({
        id: `prof_${crypto.randomUUID()}`,
        userId: sessionUser.id,
        skills: validated.skills,
        interests: validated.interests,
        experienceLevel: validated.experienceLevel,
        preferredLanguages: validated.preferredLanguages,
        contributionPreferences: validated.contributionPreferences,
      });
    }

    // Mark user as onboarded
    await db
      .update(schema.users)
      .set({
        isOnboarded: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, sessionUser.id));

    // Refresh session token with isOnboarded = true
    const updatedSessionUser = {
      ...sessionUser,
      isOnboarded: true,
    };
    const newToken = await createSessionToken(updatedSessionUser);

    const response = NextResponse.json({ success: true, redirect: "/dashboard" });
    response.cookies.set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to complete onboarding" }, { status: 500 });
  }
}
