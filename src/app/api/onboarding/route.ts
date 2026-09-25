import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionToken, createSessionToken, COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { recommendIssues } from "@/lib/recommendations/engine";

const onboardingSchema = z.object({
  experienceLevel: z.enum(["complete_beginner", "beginner", "intermediate", "advanced"]),
  preferredLanguages: z.array(z.string()).min(1, "Select at least one programming language"),
  technologies: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  interests: z.array(z.string()).min(1, "Select at least one area of interest"),
  contributionPreferences: z.array(z.string()).min(1, "Select at least one contribution preference"),
  timeCommitment: z.string().optional(),
  primaryGoal: z.string().optional(),
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

    // Deduplicate and combine into backward-compatible skills array
    const combinedSkills = Array.from(
      new Set([
        ...validated.preferredLanguages,
        ...validated.technologies,
        ...validated.tools,
      ])
    );

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
          experienceLevel: validated.experienceLevel,
          preferredLanguages: validated.preferredLanguages,
          technologies: validated.technologies,
          tools: validated.tools,
          skills: combinedSkills,
          interests: validated.interests,
          contributionPreferences: validated.contributionPreferences,
          timeCommitment: validated.timeCommitment || null,
          primaryGoal: validated.primaryGoal || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.userId, sessionUser.id));
    } else {
      await db.insert(schema.profiles).values({
        id: `prof_${crypto.randomUUID()}`,
        userId: sessionUser.id,
        experienceLevel: validated.experienceLevel,
        preferredLanguages: validated.preferredLanguages,
        technologies: validated.technologies,
        tools: validated.tools,
        skills: combinedSkills,
        interests: validated.interests,
        contributionPreferences: validated.contributionPreferences,
        timeCommitment: validated.timeCommitment || null,
        primaryGoal: validated.primaryGoal || null,
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

    // Calculate count of matching issues
    const openIssues = await db
      .select({
        id: schema.issues.id,
        projectId: schema.issues.projectId,
        projectName: schema.projects.name,
        githubRepo: schema.projects.githubRepo,
        title: schema.issues.title,
        bodySnippet: schema.issues.bodySnippet,
        htmlUrl: schema.issues.htmlUrl,
        labels: schema.issues.labels,
        difficulty: schema.issues.difficulty,
        estimatedEffort: schema.issues.estimatedEffort,
        skillsRequired: schema.issues.skillsRequired,
        isGoodFirstIssue: schema.issues.isGoodFirstIssue,
        isHelpWanted: schema.issues.isHelpWanted,
        primaryLanguage: schema.projects.primaryLanguage,
      })
      .from(schema.issues)
      .innerJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
      .where(eq(schema.issues.state, "open"))
      .limit(50);

    const mappedExpLevel =
      validated.experienceLevel === "complete_beginner"
        ? "beginner"
        : (validated.experienceLevel as "beginner" | "intermediate" | "advanced");

    const matched = recommendIssues(
      openIssues.map((i: any) => ({
        ...i,
        difficulty: i.difficulty as "beginner" | "intermediate" | "advanced",
      })),
      {
        skills: combinedSkills,
        interests: validated.interests,
        experienceLevel: mappedExpLevel,
        preferredLanguages: validated.preferredLanguages,
        contributionPreferences: validated.contributionPreferences,
      },
      10
    );

    // Refresh session token with isOnboarded = true
    const updatedSessionUser = {
      ...sessionUser,
      isOnboarded: true,
    };
    const newToken = await createSessionToken(updatedSessionUser);

    const response = NextResponse.json({
      success: true,
      matchingIssuesCount: matched.length,
      redirect: "/dashboard",
    });

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
    return NextResponse.json(
      { error: error.message || "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
