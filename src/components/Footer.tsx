import Link from "next/link";
import { Terminal, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#06080d] py-14 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand & mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono font-bold text-xs">
                TN
              </div>
              <span className="font-mono text-base font-semibold tracking-tight text-white">
                TechNexus<span className="text-sky-400">Org</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              India&apos;s student-led engineering &amp; open-source ecosystem.
              Bridging academic study and production engineering through real
              GitHub contributions, maintainer reviews, and cryptographic proof
              of work.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-slate-400">
                Core Systems Operational • Fail-Closed Infrastructure
              </span>
            </div>
          </div>

          {/* Column 1: Curriculum & Tracks */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Curriculum
            </h4>
            <ul className="mt-3.5 space-y-2.5 text-xs">
              <li>
                <Link
                  href="/learn"
                  className="hover:text-white transition-colors"
                >
                  All Learning Tracks
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/linux-fundamentals"
                  className="hover:text-white transition-colors"
                >
                  Linux &amp; POSIX
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/git-and-open-source"
                  className="hover:text-white transition-colors"
                >
                  Git &amp; Open Source
                </Link>
              </li>
              <li>
                <Link
                  href="/first-pr"
                  className="hover:text-white transition-colors"
                >
                  #FirstPR Initiative
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Engineering & Cohorts */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Engineering
            </h4>
            <ul className="mt-3.5 space-y-2.5 text-xs">
              <li>
                <Link
                  href="/internships"
                  className="hover:text-white transition-colors"
                >
                  8-Week Fellowships
                </Link>
              </li>
              <li>
                <Link
                  href="/issues"
                  className="hover:text-white transition-colors"
                >
                  Issue Marketplace
                </Link>
              </li>
              <li>
                <Link
                  href="/projects"
                  className="hover:text-white transition-colors"
                >
                  Repositories
                </Link>
              </li>
              <li>
                <Link
                  href="/partners"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Institutional Partners
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Governance & Cryptography */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Integrity
            </h4>
            <ul className="mt-3.5 space-y-2.5 text-xs">
              <li>
                <Link
                  href="/people"
                  className="hover:text-white transition-colors"
                >
                  Contributor Passports
                </Link>
              </li>
              <li>
                <Link
                  href="/founding-1000"
                  className="hover:text-white transition-colors"
                >
                  Founding 1,000 Registry
                </Link>
              </li>
              <li>
                <Link
                  href="/verify/check"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                  <span>Verify Credential</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/api/verify/keys"
                  target="_blank"
                  className="hover:text-white font-mono text-[11px] transition-colors"
                >
                  Public JWKS Keys
                </Link>
              </li>
              <li>
                <Link
                  href="/api/health"
                  target="_blank"
                  className="hover:text-white font-mono text-[11px] transition-colors flex items-center gap-1"
                >
                  <Terminal className="h-3 w-3 text-slate-500" />
                  <span>/api/health</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>
            © {new Date().getFullYear()} TechNexusOrg. No certificates for sale.
            Genuine engineering proof only.
          </p>
          <div className="flex items-center gap-6 mt-3 sm:mt-0 font-mono">
            <Link
              href="/dashboard/settings"
              className="hover:text-slate-300 transition-colors"
            >
              Privacy &amp; GDPR
            </Link>
            <a
              href="https://github.com/TechNexusOrg"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              github.com/TechNexusOrg
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
