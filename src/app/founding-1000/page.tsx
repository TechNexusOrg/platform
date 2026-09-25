import { getDb, schema } from "@/lib/db";
import { count, eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Founding 1,000 Cohort — TechNexusOrg",
  description:
    "The inaugural 1,000 verified open-source contributors shaping the TechNexusOrg engineering ecosystem.",
};

export default async function Founding1000Page() {
  const db = await getDb();

  const [membersCountRes] = await db
    .select({ value: count() })
    .from(schema.foundingMembers);
  const [activeMembersCountRes] = await db
    .select({ value: count() })
    .from(schema.foundingMembers)
    .where(eq(schema.foundingMembers.status, "active"));

  const membersCount = Number(membersCountRes?.value || 0);
  const activeMembersCount = Number(activeMembersCountRes?.value || 0);

  // Fetch recent founding members
  const recentFoundingMembers = await db
    .select({
      id: schema.foundingMembers.id,
      memberNumber: schema.foundingMembers.memberNumber,
      status: schema.foundingMembers.status,
      verifiedAt: schema.foundingMembers.verifiedAt,
      username: schema.users.githubUsername,
      displayName: schema.users.displayName,
      avatarUrl: schema.users.avatarUrl,
    })
    .from(schema.foundingMembers)
    .innerJoin(schema.users, eq(schema.foundingMembers.userId, schema.users.id))
    .limit(20);

  const percentage = Math.min(100, Math.round((membersCount / 1000) * 100));

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/40 px-3.5 py-1 text-xs font-mono text-amber-300">
          Cohort Status: Open ({membersCount} / 1,000 Claimed)
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-mono uppercase tracking-tight">
          The Founding 1,000
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The inaugural cohort of engineers, students, and maintainers building public proof of work on official TechNexusOrg repositories.
        </p>
      </div>

      {/* Progress Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase text-slate-400">Total Cohort Capacity</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {membersCount} <span className="text-slate-500">/ 1,000 Members</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs font-mono uppercase text-emerald-400">Verified Active</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {activeMembersCount} with Merged PRs
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(percentage, 2)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-500">
            <span>#0001</span>
            <span>{percentage}% Filled</span>
            <span>#1000</span>
          </div>
        </div>

        {/* Crucial Integrity Rule */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-4 text-xs space-y-1">
          <span className="font-mono font-semibold text-amber-400 uppercase text-[11px]">
            Integrity Principle: Registration ≠ Founding Contributor
          </span>
          <p className="text-slate-400 leading-relaxed">
            Creating an account alone does not grant permanent Founding Contributor status. A contributor must make at least one verified, merged pull request on an official project to lock their position in the Founding 1,000 registry.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <Link
            href="/first-pr"
            className="rounded-lg bg-sky-500 px-6 py-2.5 text-xs font-semibold font-mono text-slate-950 hover:bg-sky-400 transition-colors"
          >
            Start Your First PR →
          </Link>
        </div>
      </div>

      {/* Roster */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
          Founding Registry Roster
        </h2>

        {recentFoundingMembers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
            <p className="text-xs text-slate-400 font-mono">
              The founding registry has just opened.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Be among the very first engineers to claim your permanent founding number!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentFoundingMembers.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-3"
              >
                <div className="flex items-center gap-3">
                  {member.avatarUrl && (
                    <img
                      src={member.avatarUrl}
                      alt={member.username}
                      className="h-8 w-8 rounded-full border border-slate-700"
                    />
                  )}
                  <div>
                    <div className="text-xs font-bold text-white">
                      {member.displayName || member.username}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      @{member.username}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-amber-400">
                    #{String(member.memberNumber).padStart(4, "0")}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 uppercase">
                    {member.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
