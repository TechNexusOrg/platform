import { getDb, schema } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";

export interface PassportTimelineItem {
  id: string;
  type: "pr_merged" | "credential_awarded" | "joined";
  title: string;
  description: string;
  timestamp: Date;
  url?: string;
  meta?: Record<string, any>;
}

export interface ContributorPassportData {
  user: {
    id: string;
    githubUsername: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    location: string | null;
    portfolioUrl: string | null;
    linkedinUrl: string | null;
    role: string;
    level: string;
    foundingNumber: number | null;
    isPublic: boolean;
    createdAt: Date;
  };
  profile: {
    skills: string[];
    interests: string[];
    experienceLevel: string;
    preferredLanguages: string[];
    contributionPreferences: string[];
  } | null;
  statistics: {
    mergedPrs: number;
    openedPrs: number;
    projectsContributed: number;
    credentialsEarned: number;
  };
  credentials: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    issuedAt: Date;
    verificationUrl: string;
    evidenceData: any;
  }>;
  contributions: Array<{
    id: string;
    projectName: string;
    githubRepo: string;
    prNumber: number;
    prTitle: string;
    prUrl: string;
    state: string;
    isFirstPr: boolean;
    mergedAt: Date | null;
    verifiedAt: Date | null;
  }>;
  timeline: PassportTimelineItem[];
  isPrivateProfile?: boolean;
}

export async function getContributorPassport(
  username: string,
  viewerId?: string
): Promise<ContributorPassportData | { notFound: true } | { isPrivate: true; username: string }> {
  const db = await getDb();

  // Case-insensitive lookup by GitHub username
  const matchingUsers = await db
    .select()
    .from(schema.users)
    .where(sql`lower(${schema.users.githubUsername}) = lower(${username})`)
    .limit(1);

  if (matchingUsers.length === 0) {
    return { notFound: true };
  }

  const user = matchingUsers[0];

  // Privacy Check: If private and viewer is not the owner
  if (!user.isPublic && user.id !== viewerId) {
    return { isPrivate: true, username: user.githubUsername };
  }

  // Fetch profile
  const profiles = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id))
    .limit(1);

  const profile = profiles[0] || null;

  // Fetch contributions joined with projects
  const rawContributions = await db
    .select({
      id: schema.contributions.id,
      prNumber: schema.contributions.githubPrNumber,
      prTitle: schema.contributions.prTitle,
      prUrl: schema.contributions.prUrl,
      state: schema.contributions.state,
      isFirstPr: schema.contributions.isFirstPr,
      mergedAt: schema.contributions.mergedAt,
      verifiedAt: schema.contributions.verifiedAt,
      createdAt: schema.contributions.createdAt,
      projectName: schema.projects.name,
      githubRepo: schema.projects.githubRepo,
      projectId: schema.projects.id,
    })
    .from(schema.contributions)
    .innerJoin(schema.projects, eq(schema.contributions.projectId, schema.projects.id))
    .where(eq(schema.contributions.userId, user.id))
    .orderBy(desc(schema.contributions.createdAt));

  // Fetch credentials
  const credentials = await db
    .select({
      id: schema.credentials.id,
      type: schema.credentials.type,
      title: schema.credentials.title,
      description: schema.credentials.description,
      status: schema.credentials.status,
      issuedAt: schema.credentials.issuedAt,
      verificationUrl: schema.credentials.verificationUrl,
      evidenceData: schema.credentials.evidenceData,
    })
    .from(schema.credentials)
    .where(eq(schema.credentials.userId, user.id))
    .orderBy(desc(schema.credentials.issuedAt));

  // Compute real statistics
  const mergedPrs = rawContributions.filter((c: any) => c.state === "merged").length;
  const openedPrs = rawContributions.length;
  const distinctProjects = new Set(rawContributions.map((c: any) => c.projectId)).size;

  // Build unified chronological timeline
  const timeline: PassportTimelineItem[] = [];

  // Account creation event
  timeline.push({
    id: `event_join_${user.id}`,
    type: "joined",
    title: "Joined TechNexusOrg",
    description: "Verified GitHub identity linked to contributor infrastructure",
    timestamp: user.createdAt,
  });

  // Contribution events
  for (const contrib of rawContributions) {
    if (contrib.state === "merged") {
      timeline.push({
        id: `event_contrib_${contrib.id}`,
        type: "pr_merged",
        title: `Merged PR #${contrib.prNumber} in ${contrib.githubRepo}`,
        description: contrib.prTitle,
        timestamp: contrib.mergedAt || contrib.createdAt,
        url: contrib.prUrl,
        meta: {
          isFirstPr: contrib.isFirstPr,
        },
      });
    }
  }

  // Credential events
  for (const cred of credentials) {
    timeline.push({
      id: `event_cred_${cred.id}`,
      type: "credential_awarded",
      title: `Earned Credential: ${cred.title}`,
      description: cred.description,
      timestamp: cred.issuedAt,
      url: cred.verificationUrl,
    });
  }

  // Sort descending by timestamp
  timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    user: {
      id: user.id,
      githubUsername: user.githubUsername,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      portfolioUrl: user.portfolioUrl,
      linkedinUrl: user.linkedinUrl,
      role: user.role,
      level: user.level,
      foundingNumber: user.foundingNumber,
      isPublic: user.isPublic,
      createdAt: user.createdAt,
    },
    profile: profile
      ? {
          skills: profile.skills || [],
          interests: profile.interests || [],
          experienceLevel: profile.experienceLevel || "beginner",
          preferredLanguages: profile.preferredLanguages || [],
          contributionPreferences: profile.contributionPreferences || [],
        }
      : null,
    statistics: {
      mergedPrs,
      openedPrs,
      projectsContributed: distinctProjects,
      credentialsEarned: credentials.length,
    },
    credentials,
    contributions: rawContributions.map((c: any) => ({
      id: c.id,
      projectName: c.projectName,
      githubRepo: c.githubRepo,
      prNumber: c.prNumber,
      prTitle: c.prTitle,
      prUrl: c.prUrl,
      state: c.state,
      isFirstPr: c.isFirstPr,
      mergedAt: c.mergedAt,
      verifiedAt: c.verifiedAt,
    })),
    timeline,
  };
}
