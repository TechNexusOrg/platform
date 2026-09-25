# TechNexusOrg Architecture Specification

## 1. System Overview

TechNexusOrg connects aspiring software engineers with verified open-source contributions. The core tenet is that **GitHub evidence is the source of truth**.

```
GitHub Identity & OAuth
        ↓
Contributor Onboarding (Skills & Interests)
        ↓
Contribution Marketplace (Issues & Projects)
        ↓
Fork → Branch → Pull Request
        ↓
Maintainer Code Review & CI Pass
        ↓
PR Merged into Official Repository
        ↓
GitHub Webhook (HMAC SHA256 Verified)
        ↓
Evidence Recorded in Database
        ↓
Progression Engine Evaluated (Explorer → Contributor → Core)
        ↓
Verifiable Proof of Work Minted (/verify/[id])
```

---

## 2. Directory Structure

```
├── .github/workflows/ci.yml       # CI pipeline (lint, typecheck, test, build)
├── drizzle/                       # Generated SQL migration files
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/              # GitHub OAuth & session lifecycle
│   │   │   ├── health/            # System health monitor (/api/health)
│   │   │   ├── onboarding/        # Contributor profile configuration
│   │   │   └── webhooks/github/   # HMAC-verified webhook event ingest
│   │   ├── dashboard/             # Authenticated contributor cockpit
│   │   ├── first-pr/              # #FirstPR initiative portal
│   │   ├── founding-1000/         # Live Founding 1,000 registry
│   │   ├── issues/                # Contribution marketplace
│   │   ├── onboarding/            # Profile onboarding flow
│   │   ├── projects/              # Official repository directory
│   │   ├── verify/[id]/           # Canonical public verification records
│   │   └── layout.tsx & page.tsx  # Root shell & Technical landing page
│   ├── components/                # Reusable UI components (Navbar, Footer, etc.)
│   └── lib/
│       ├── auth/                  # JWT session management & GitHub OAuth
│       ├── credentials/           # Proof-of-work minting & metadata engine
│       ├── db/                    # Drizzle ORM schema, client & migrations
│       ├── env.ts                 # Strict Zod environment validation
│       ├── github/                # Octokit client & HMAC webhook verifier
│       ├── metrics/               # Live database metrics aggregator (zero mock data)
│       └── progression/           # Deterministic contributor progression engine
```

---

## 3. Database Entities & Relationships

| Entity | Primary Role | Key Constraints |
| :--- | :--- | :--- |
| `users` | Primary contributor account | `github_id` (unique), `github_username` (unique) |
| `profiles` | Contributor skills, interests, level | `user_id` (unique, FK cascade) |
| `projects` | Official TechNexus repositories | `github_repo` (unique), `slug` (unique) |
| `issues` | Synced GitHub issues | `github_issue_id` (unique), `project_id` (FK) |
| `contributions`| Verified PR submissions & merges | `pr_url` (unique), `user_id` (FK), `project_id` (FK) |
| `credentials` | Verifiable proof-of-work records | `id` (unique format `cred_tn_*`), `evidence_data` (JSONB) |
| `founding_members`| Founding 1,000 cohort records | `member_number` (unique 1-1000), `user_id` (unique) |
| `audit_logs` | Security & administrative actions | `action`, `actor_id`, `target_id`, `created_at` |

---

## 4. Security Model

1. **Authentication**: Stateless, encrypted HS256 JWT stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies. No sensitive GitHub tokens exposed to client bundles.
2. **Webhook Integrity**: Strict HMAC SHA-256 signature verification with `crypto.timingSafeEqual` prevents webhook spoofing.
3. **Audit Trail**: Every progression elevation, credential issuance, and status change is persisted in `audit_logs`.
4. **Environment Isolation**: Mandatory schema validation at startup via `src/lib/env.ts`.
