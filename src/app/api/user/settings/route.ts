import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const settingsSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(300).optional(),
  location: z.string().max(100).optional(),
  portfolioUrl: z.string().url().or(z.literal("")).optional(),
  linkedinUrl: z.string().url().or(z.literal("")).optional(),
  isPublic: z.boolean().default(true),
  skills: z.array(z.string()).default([]),
});

export async function PATCH(request: NextRequest) {
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
    const data = settingsSchema.parse(body);
    const db = await getDb();

    // Update user record
    await db
      .update(schema.users)
      .set({
        displayName: data.displayName !== undefined ? data.displayName : undefined,
        bio: data.bio !== undefined ? data.bio : undefined,
        location: data.location !== undefined ? data.location : undefined,
        portfolioUrl: data.portfolioUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        isPublic: data.isPublic,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, sessionUser.id));

    // Update profile skills if provided
    if (data.skills) {
      await db
        .update(schema.profiles)
        .set({
          skills: data.skills,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.userId, sessionUser.id));
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
