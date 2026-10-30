import crypto from "crypto";

export interface GenerateOfferLetterParams {
  studentId: string;
  studentUsername: string;
  studentDisplayName?: string | null;
  programId: string;
  programTitle: string;
  programTrack: string;
  durationWeeks: number;
  startDate: Date;
  targetEndDate: Date;
  mentorUsername?: string | null;
  mentorDisplayName?: string | null;
}

export interface OfferLetterDocument {
  offerId: string;
  verificationHash: string;
  issuedAt: string;
  organization: {
    name: string;
    legalStatus: string;
    website: string;
  };
  student: {
    id: string;
    username: string;
    displayName: string;
  };
  program: {
    id: string;
    title: string;
    track: string;
    durationWeeks: number;
  };
  schedule: {
    startDate: string;
    targetEndDate: string;
  };
  mentor: {
    assigned: boolean;
    name: string;
  };
  terms: string[];
}

/**
 * Computes a deterministic SHA-256 verification hash for an internship offer letter.
 */
export function computeOfferHash(params: GenerateOfferLetterParams): string {
  const canonicalPayload = JSON.stringify({
    org: "TechNexusOrg",
    studentId: params.studentId,
    studentUsername: params.studentUsername.toLowerCase(),
    programId: params.programId,
    programTitle: params.programTitle,
    durationWeeks: params.durationWeeks,
    startDate: params.startDate.toISOString().split("T")[0],
    targetEndDate: params.targetEndDate.toISOString().split("T")[0],
  });

  return crypto.createHash("sha256").update(canonicalPayload).digest("hex");
}

/**
 * Generates an immutable, verified offer letter document.
 */
export function generateOfferLetter(
  params: GenerateOfferLetterParams
): OfferLetterDocument {
  const offerId = `tn-off-${crypto.randomBytes(6).toString("hex")}`;
  const verificationHash = computeOfferHash(params);
  const issuedAt = new Date().toISOString();

  return {
    offerId,
    verificationHash,
    issuedAt,
    organization: {
      name: "TechNexusOrg",
      legalStatus: "Open-Source Engineering & Contributor Ecosystem",
      website: "https://github.com/TechNexusOrg",
    },
    student: {
      id: params.studentId,
      username: params.studentUsername,
      displayName: params.studentDisplayName || params.studentUsername,
    },
    program: {
      id: params.programId,
      title: params.programTitle,
      track: params.programTrack,
      durationWeeks: params.durationWeeks,
    },
    schedule: {
      startDate: params.startDate.toISOString().split("T")[0],
      targetEndDate: params.targetEndDate.toISOString().split("T")[0],
    },
    mentor: {
      assigned: !!params.mentorUsername,
      name: params.mentorDisplayName || params.mentorUsername || "Assigned Engineering Mentor",
    },
    terms: [
      "The fellowship is structured around real-world open-source contributions to verified TechNexusOrg repositories.",
      "Participant agrees to commit a minimum of 10-15 hours per week to engineering tasks, milestone deliverables, and code reviews.",
      "All code authored must be licensed under standard permissive open-source licenses (MIT/Apache-2.0) and adhere to Conventional Commits.",
      "Weekly work logs with linked pull requests must be submitted through the Contributor Portal for mentor evaluation.",
      "Formal verifiable completion credentials are only issued upon successful evaluation and merged pull request verification.",
    ],
  };
}
