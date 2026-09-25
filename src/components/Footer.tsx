import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#070a11] py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-semibold tracking-tight text-white">
                TechNexus<span className="text-sky-400">Org</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              A GitHub-native contributor and career infrastructure platform. Build real software, make legitimate contributions, and establish verified public proof of work.
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Not a certificate-selling website. GitHub evidence is the source of truth.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Programs
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/first-pr" className="hover:text-white transition-colors">
                  #FirstPR Initiative
                </Link>
              </li>
              <li>
                <Link href="/founding-1000" className="hover:text-white transition-colors">
                  Founding 1,000 Cohort
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-white transition-colors">
                  Official Projects
                </Link>
              </li>
              <li>
                <Link href="/issues" className="hover:text-white transition-colors">
                  Contribution Marketplace
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
              Governance & Proof
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <a
                  href="https://github.com/TechNexusOrg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub Organization
                </a>
              </li>
              <li>
                <Link href="/verify/check" className="hover:text-white transition-colors">
                  Credential Verification
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/TechNexusOrg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Community Guidelines
                </a>
              </li>
              <li>
                <Link href="/api/health" className="hover:text-white font-mono text-[11px] transition-colors">
                  System Health (/api/health)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} TechNexusOrg. Built with integrity for genuine engineers.</p>
          <p className="font-mono mt-2 sm:mt-0">milestone: v0.1.0-foundation</p>
        </div>
      </div>
    </footer>
  );
}
