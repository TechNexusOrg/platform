import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";
import { getDb, schema } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { eq } from "drizzle-orm";

describe("POST /api/partners/proposals", () => {
  beforeEach(async () => {
    await runMigrations();
  });

  it("should reject invalid proposal payloads", async () => {
    const req = new Request("http://localhost:3000/api/partners/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationName: "",
        contactName: "",
        contactEmail: "invalid-email",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("Validation failed");
    expect(data.details).toBeDefined();
  });

  it("should successfully store a valid institutional proposal", async () => {
    const payload = {
      organizationName: "Indian Institute of Open Source",
      contactName: "Prof. Vikram Sarabhai",
      contactEmail: "vikram@iios.edu.in",
      partnerType: "university",
      proposalType: "project_partnership",
      summary:
        "Proposing a semester-long capstone track in distributed systems and POSIX kernels.",
      targetTechnologies: ["Linux", "Go", "Rust", "PostgreSQL"],
      estimatedStudentCapacity: 25,
    };

    const req = new Request("http://localhost:3000/api/partners/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.proposalId).toBeDefined();

    // Verify record in database
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.partnerProposals)
      .where(eq(schema.partnerProposals.id, data.proposalId));

    expect(rows).toHaveLength(1);
    expect(rows[0].organizationName).toBe(payload.organizationName);
    expect(rows[0].contactEmail).toBe(payload.contactEmail);
    expect(rows[0].partnerType).toBe(payload.partnerType);
    expect(rows[0].status).toBe("submitted");
    expect(rows[0].estimatedStudentCapacity).toBe(25);
  });
});
