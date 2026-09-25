import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { SettingsForm } from "./SettingsForm";

export const metadata = {
  title: "Profile & Privacy Settings — TechNexusOrg",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/api/auth/github");
  }

  const sessionUser = await verifySessionToken(token);
  if (!sessionUser) {
    redirect("/api/auth/github");
  }

  const db = await getDb();

  const userRes = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, sessionUser.id))
    .limit(1);

  const profileRes = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, sessionUser.id))
    .limit(1);

  if (userRes.length === 0) {
    redirect("/api/auth/github");
  }

  const user = userRes[0];
  const profile = profileRes[0] || null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">
            Passport Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your public contributor identity, privacy controls, and technical skills.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/people/${user.githubUsername}`}
            className="text-xs font-mono text-sky-400 hover:text-sky-300 underline"
          >
            View Public Passport ↗
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-mono text-slate-400 hover:text-white"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <SettingsForm
        initialUser={{
          githubUsername: user.githubUsername,
          displayName: user.displayName,
          bio: user.bio,
          location: user.location,
          portfolioUrl: user.portfolioUrl,
          linkedinUrl: user.linkedinUrl,
          isPublic: user.isPublic,
        }}
        initialSkills={profile?.skills || []}
      />
    </div>
  );
}
