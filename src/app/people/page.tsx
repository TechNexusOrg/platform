import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Public Contributor Directory — TechNexusOrg",
  description:
    "Explore genuine open-source engineers building verified public proof of work across official TechNexusOrg repositories.",
};

export default async function PeopleDirectoryPage() {
  const db = await getDb();

  const publicUsers = await db
    .select({
      id: schema.users.id,
      githubUsername: schema.users.githubUsername,
      displayName: schema.users.displayName,
      avatarUrl: schema.users.avatarUrl,
      level: schema.users.level,
      foundingNumber: schema.users.foundingNumber,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.isPublic, true))
    .orderBy(desc(schema.users.createdAt))
    .limit(50);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-mono uppercase tracking-tight">
          Contributor Directory
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Engineers with public proof of work. Every contributor passport links to verified pull requests, reviews, and credentials.
        </p>
      </div>

      {publicUsers.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="font-mono text-xs text-sky-400 uppercase tracking-wider">
            Directory Status
          </div>
          <h2 className="text-xl font-bold text-white font-mono">
            No Public Contributors Registered Yet
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Connect your GitHub account to initialize your Contributor Passport and be listed in the inaugural public directory.
          </p>
          <div className="pt-2">
            <a
              href="/api/auth/github"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2 text-xs font-semibold font-mono text-slate-950 hover:bg-sky-400 transition-colors"
            >
              Claim Your Contributor Passport →
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicUsers.map((user: any) => (
            <Link
              key={user.id}
              href={`/people/${user.githubUsername}`}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 flex items-center justify-between hover:border-slate-700 hover:bg-slate-900/70 transition-all group"
            >
              <div className="flex items-center gap-3.5">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.githubUsername}
                    className="h-12 w-12 rounded-xl border border-slate-700 bg-slate-800"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center font-mono font-bold text-slate-400">
                    {user.githubUsername[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                    {user.displayName || user.githubUsername}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    @{user.githubUsername}
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-block rounded bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[10px] font-mono text-sky-300 capitalize">
                  {user.level.replace("_", " ")}
                </span>
                {user.foundingNumber && (
                  <div className="text-[10px] font-mono text-amber-400 font-semibold">
                    #{String(user.foundingNumber).padStart(4, "0")}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
