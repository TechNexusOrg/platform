import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";

const proposalSchema = z.object({
  organizationName: z
    .string()
    .min(2, "Organization name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  contactEmail: z.string().email("Please provide a valid email address"),
  partnerType: z.enum([
    "university",
    "company",
    "open_source_collective",
    "other",
  ]),
  proposalType: z.enum([
    "project_partnership",
    "cohort_sponsorship",
    "mentorship_program",
    "hiring_pipeline",
  ]),
  summary: z
    .string()
    .min(10, "Summary must be at least 10 characters")
    .max(2000),
  targetTechnologies: z.array(z.string()).default([]),
  estimatedStudentCapacity: z.number().int().min(1).max(1000).default(10),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = proposalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.errors },
        { status: 400 },
      );
    }

    const {
      organizationName,
      contactName,
      contactEmail,
      partnerType,
      proposalType,
      summary,
      targetTechnologies,
      estimatedStudentCapacity,
    } = result.data;

    // Ensure database migration has executed
    await runMigrations();
    const db = await getDb();

    const proposalId = `prop_${crypto.randomUUID()}`;

    await db.insert(schema.partnerProposals).values({
      id: proposalId,
      organizationName,
      contactName,
      contactEmail,
      partnerType,
      proposalType,
      summary,
      targetTechnologies,
      estimatedStudentCapacity,
      status: "submitted",
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Partner proposal submitted successfully. Our team will review and contact you.",
        proposalId,
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("Failed to submit partner proposal:", err);
    return NextResponse.json(
      { error: "Internal server error submitting proposal" },
      { status: 500 },
    );
  }
}
