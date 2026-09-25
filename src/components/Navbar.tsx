import Link from "next/link";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";

export async function Navbar() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#090d16]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono font-bold text-sm">
              TN
            </div>
            <span className="font-mono text-base font-semibold tracking-tight text-white">
              TechNexus<span className="text-sky-400">Org</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <Link href="/first-pr" className="hover:text-white transition-colors">
              #FirstPR
            </Link>
            <Link href="/founding-1000" className="hover:text-white transition-colors">
              Founding 1,000
            </Link>
            <Link href="/projects" className="hover:text-white transition-colors">
              Projects
            </Link>
            <Link href="/issues" className="hover:text-white transition-colors">
              Issues
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/TechNexusOrg"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono transition-colors"
          >
            <span>github.com/TechNexusOrg</span>
          </a>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-700 hover:bg-slate-900 transition-colors"
              >
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.githubUsername}
                    className="h-5 w-5 rounded-full border border-slate-700"
                  />
                )}
                <span>@{user.githubUsername}</span>
                <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-300 font-mono capitalize">
                  {user.level.replace("_", " ")}
                </span>
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <a
              href="/api/auth/github"
              className="flex items-center gap-2 rounded-md bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-slate-200 transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>Continue with GitHub</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
