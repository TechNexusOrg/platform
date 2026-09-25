import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getMentorRequestsForUser } from "@/lib/mentorship/service";
import { MentorshipClient } from "./MentorshipClient";

export const metadata = {
  title: "Engineering Mentorship & Support — TechNexusOrg",
  description: "Request technical guidance or code review assistance from maintainers on claimed issues.",
};

export const dynamic = "force-dynamic";

export default async function MentorshipPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/join");
  }

  const sessionUser = await verifySessionToken(token);
  if (!sessionUser) {
    redirect("/join");
  }

  const db = await getDb();

  // Fresh role check
  const [dbUser] = await db
    .select({ role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.id, sessionUser.id))
    .limit(1);

  const isMaintainer = dbUser?.role === "admin" || dbUser?.role === "maintainer";

  // Fetch user's active claim issues
  const activeClaims = await db
    .select({
      id: schema.issues.id,
      title: schema.issues.title,
      githubIssueNumber: schema.issues.githubIssueNumber,
      projectName: schema.projects.name,
      githubRepo: schema.projects.githubRepo,
    })
    .from(schema.issueClaims)
    .innerJoin(schema.issues, eq(schema.issueClaims.issueId, schema.issues.id))
    .innerJoin(schema.projects, eq(schema.issues.projectId, schema.projects.id))
    .where(
      and(
        eq(schema.issueClaims.userId, sessionUser.id),
        eq(schema.issueClaims.status, "active")
      )
    );

  // Fetch mentorship requests
  const requests = await getMentorRequestsForUser(sessionUser.id, isMaintainer, db);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono">
          Engineering Mentorship & Support
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Connect with repository maintainers and engineering mentors when blocked on implementation details.
        </p>
      </div>

      <MentorshipClient
        initialRequests={requests as any}
        activeClaimIssues={activeClaims}
        isMaintainer={isMaintainer}
        currentUserId={sessionUser.id}
      />
    </div>
  );
}
