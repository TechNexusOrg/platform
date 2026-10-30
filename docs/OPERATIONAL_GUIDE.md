# TechNexusOrg — Operational & Institutional Playbook
## Production Operations, Campus Partnerships & Institutional Readiness

This guide outlines the production engineering procedures, campus partnership protocols, and legal/institutional checklist for operating **TechNexusOrg**.

---

## 1. Production Deployment & Infrastructure Runbook

### A. Environment Configuration Requirements
In `NODE_ENV=production`, the application operates under a strict **fail-closed** security policy:
- Local PGlite database fallback is strictly disabled. A managed PostgreSQL instance (Supabase, Neon, AWS RDS, or DigitalOcean) is mandatory.
- Weak or development placeholder secrets (`dev_secret_...`) are rejected during boot.
- Constant-time string comparison (`safeCompare`) is enforced on all automated service synchronization endpoints.

#### Mandatory Production Variables:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
APP_URL=https://platform.technexus.org
AUTH_SECRET=<generate with: openssl rand -base64 32>
INTERNAL_SERVICE_SECRET=<generate with: openssl rand -base64 32>
GITHUB_CLIENT_ID=<from GitHub OAuth App>
GITHUB_CLIENT_SECRET=<from GitHub OAuth App>
GITHUB_WEBHOOK_SECRET=<generate with: openssl rand -base64 32>
CREDENTIAL_SIGNING_PRIVATE_KEY=<PEM formatted Ed25519 private key>
CREDENTIAL_SIGNING_PUBLIC_KEY=<PEM formatted Ed25519 public key>
```

### B. Database Migrations
Run schema migrations against the production database:
```bash
npm run db:migrate
```

### C. GitHub Organization Trust Boundary
All official projects and webhook events are restricted to the verified organization ID:
- Canonical GitHub Organization: `TechNexusOrg`
- Verified Numeric ID: `333899669`
Any webhook event or project synchronization originating from an unapproved repository is rejected with an audit log entry.

---

## 2. Campus & Training and Placement (TPO) Partnership Framework

Traditional college projects and unverified certificates have saturated campus recruitment. TechNexusOrg offers academic institutions an evidence-based proof-of-work pipeline.

### A. Value Proposition for Colleges & TPOs
1. **Zero Hallucinated Experience:** Recruiters review actual merged code, commit histories, and review threads on GitHub.
2. **Cryptographic Verifiability:** Every credential contains an Ed25519 signature verifiable against our public JWKS endpoint (`/api/verify/keys`).
3. **Structured Curricula:** Complete semester-aligned tracks in Systems Programming (Linux/POSIX) and Open-Source Software Engineering (Git/CI/CD).
4. **Supervised Fellowships:** Structured 8-week apprenticeships with bi-weekly milestones, mandatory weekly work logs, and 5-point mentor evaluation rubrics.

### B. Institutional Onboarding Checklist
- [ ] **Faculty Advisor Appointment:** Designate a department faculty coordinator to monitor student participation.
- [ ] **Cohort Schedule Alignment:** Schedule 8-week fellowship cohorts to coincide with winter/summer semester breaks.
- [ ] **Student Onboarding Workshop:** Conduct a 60-minute practical onboarding session using `docs/STUDENT_GUIDE.md`.
- [ ] **TPO Verification Access:** Share the public verification portal (`/verify/[id]`) and student passports (`/people/[username]`) with hiring partners.

---

## 3. Legal Entity & Regulatory Checklist (India)

To operate as a formal non-profit open-source foundation or student developer ecosystem in India:

### Step 1: Legal Structure Selection
- **Option A (Recommended for Non-Profit/Community):** Section 8 Company (Companies Act, 2013). Provides highest credibility with universities, corporate CSR grants, and international open-source foundations.
- **Option B (Fast Setup / Micro-Enterprise):** MSME Udyam Registration (under Ministry of Micro, Small and Medium Enterprises) as a Sole Proprietorship or LLP for educational technology services.

### Step 2: Registrations Checklist
- [ ] **Name Approval & Incorporation:** Reserve entity name (e.g., `TechNexus Open Source Foundation` or `TechNexus Engineering Foundation`).
- [ ] **PAN & TAN Allocation:** Dedicated corporate Permanent Account Number and Tax Deduction Account Number.
- [ ] **MSME Udyam Registration:** Free online registration via `udyamregistration.gov.in` under NIC code `6201` (Computer programming activities) or `8549` (Other education).
- [ ] **Corporate Bank Account:** Open current account in the name of the registered entity with corporate internet banking.
- [ ] **Trademark Filing:** File trademark application for `TechNexusOrg` under Class 41 (Education/Training) and Class 42 (Software/Technology services).
- [ ] **Section 12A & 80G (for Section 8):** Income tax exemptions for philanthropic educational initiatives.

---

## 4. Contributor Progression & Anti-Spam Governance

1. **First PR Verification:** Merged PRs are verified automatically via webhook HMAC SHA-256 signatures. PRs must contain code changes addressing an approved open issue (`Fixes #123`).
2. **Anti-Spam Thresholds:** Trivial typo PRs, cosmetic whitespace changes, or auto-generated submissions without issue links are closed with `invalid` labels and excluded from progression metrics.
3. **Claim System Invariant:** Issue claims lease for 7 days. If no PR is linked within 7 days, the claim automatically expires, returning the issue to the public marketplace.
4. **Mentor Review Rubrics:** Fellowship completions require a 5-point evaluation across Code Quality, Collaboration, Punctuality, Documentation, and Initiative.
