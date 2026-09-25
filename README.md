# TechNexusOrg Platform

> **Build real software. Make real contributions. Build public proof of work.**

TechNexusOrg is a GitHub-native contributor and career infrastructure platform connecting students and early-career developers with legitimate open-source engineering experience.

This is **not a certificate-selling website**. Credentials and Contributor Passports are cryptographically verifiable records generated exclusively from verified, reviewed, and merged GitHub pull requests.

---

## 🚀 Public Milestone 1: Founding 1,000

**#FirstPR → Verified Contributor → Core Contributor**

The flagship campaign helps developers transition from tutorials to real repository contributions:
1. **Connect GitHub**: Authenticate with verified GitHub identity.
2. **Deterministic Matching**: Discover curated good-first-issues matching your selected skills and experience level.
3. **Submit PR**: Fork, branch, write code and tests, submit PR.
4. **Automated Verification**: GitHub webhooks verify merged PRs, evaluate progression, and issue verifiable proof-of-work records.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode, noEmit typechecking)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Developer-focused dark mode theme)
- **Database**: PostgreSQL (Production) with embedded PGlite support for zero-config local testing
- **ORM & Migrations**: [Drizzle ORM](https://orm.drizzle.team/) & Drizzle Kit
- **Authentication**: GitHub OAuth + secure HS256 JWT sessions via [jose](https://github.com/panva/jose)
- **Testing**: [Vitest](https://vitest.dev/) (Unit & Integration tests)
- **Validation**: [Zod](https://zod.dev/) (Environment & API boundary validation)

---

## 📦 Getting Started

### Prerequisites

- Node.js >= 20 (v22 recommended)
- npm >= 10

### 1. Clone & Install

```bash
git clone https://github.com/TechNexusOrg/platform.git
cd platform
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required variables:
- `AUTH_SECRET`: Random 32+ character string for JWT signing
- `GITHUB_CLIENT_ID`: GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth App Client Secret
- `DATABASE_URL`: Optional for local dev (falls back to embedded PGlite)

### 3. Run Database Migrations

```bash
npm run db:generate
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing, Linting & Build

Every contribution must pass the complete quality gate:

```bash
# Run unit & integration tests
npm test

# Run strict TypeScript typecheck
npm run typecheck

# Run ESLint
npm run lint

# Production build
npm run build
```

---

## 🛡️ Security & Anti-Gaming

- **Webhook Verification**: GitHub webhook payloads are validated using timing-safe HMAC SHA256 signatures (`x-hub-signature-256`).
- **No Mock Counters**: Production dashboards only display verifiable counts aggregated directly from the database.
- **Role & Progression Enforcement**: Progression levels are calculated deterministically on the server based on immutable merge events.
- **Audit Logging**: Sensitive operations (credential minting, role updates) are immutably logged to the `audit_logs` table.

---

## 📄 License

Licensed under the [Apache-2.0 License](./LICENSE).
