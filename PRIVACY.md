# TechNexusOrg Privacy Policy

> **NOTICE: DRAFT DOCUMENT REQUIRING RESPONSIBLE LEGAL REVIEW**  
> *This document sets out the operational and technical privacy practices of the TechNexusOrg platform. It is currently in draft status and requires formal legal review by qualified counsel before being designated as a binding legal agreement. Entity details and contact addresses are marked with placeholders until formally incorporated.*

---

## 1. Introduction and Philosophy

TechNexusOrg operates a GitHub-native engineering platform for students and early-career developers. Our engineering philosophy is **Privacy by Default**:
- Student profiles are private by default upon registration.
- No personal data or email addresses are published without explicit contributor consent.
- GitHub activity records (commits, pull requests, issue claims) link directly to official GitHub public URLs rather than storing duplicate private repository data.

---

## 2. Information We Collect

### A. Authentication & GitHub Data
When you authenticate via GitHub OAuth, we receive from GitHub:
- Immutable GitHub numeric User ID.
- GitHub username (`login`).
- Public profile information (avatar URL, bio, location, public profile link).
- Primary verified email address (stored privately for authentication and critical security notifications; never published publicly).

### B. Contributor Profile Data (Self-Reported)
- Technical skills, interests, and preferred programming languages.
- Optional portfolio and LinkedIn URLs.
- Self-selected learning track enrollment and assignment submissions.

### C. Contribution & Progression Records
- Pull request numbers, titles, and merge statuses on official TechNexusOrg repositories.
- Code review participation on approved projects.
- Issue claim timestamps and completion records.
- Verifiable credentials and founding member sequence allocations.

---

## 3. Purpose of Processing

We process student data strictly to:
1. Facilitate open-source project matching and issue reservation (preventing claim conflicts).
2. Verify pull request merges on official TechNexusOrg projects.
3. Compute authoritative progression levels and mint verifiable credentials.
4. Provide structured mentorship and code review workflows.
5. Enable students to demonstrate verifiable public proof of work when they opt to make their Contributor Passport public.

We do **not** sell student data, license student records to marketing brokers, or serve third-party behavioral advertisements.

---

## 4. Profile Visibility & Consent

- **Private by Default:** All newly created student accounts start in private mode (`is_public = false`).
- **Explicit Consent Toggle:** Contributor Passports at `/people/<username>` and inclusion in `/people` directory become accessible only when a contributor explicitly toggles their passport to public in `Settings`.
- **Public Proof of Work:** When public mode is enabled, your passport showcases your GitHub username, display name, skills, and verified public contribution links. Private email addresses and internal database identifiers are never displayed.
- **Revocation of Consent:** Contributors may switch their profile back to private at any time in their dashboard settings.

---

## 5. Data Sharing

Data is only shared with:
- **GitHub API:** To verify repository permissions, pull request merge events, and review statuses.
- **Hosting and Database Infrastructure:** Secure cloud database infrastructure adhering to industry encryption standards (TLS in transit, encrypted storage at rest).

---

## 6. Data Retention and Account Erasure (GDPR Rights)

- **Data Portability:** Students have the right to download a complete export of all personal, profile, contribution, claim, and credential data in machine-readable JSON format at any time via `/api/user/export`.
- **Right to Erasure (Account Deletion):** Students may permanently delete their account and associated personal data at any time via `/api/user/delete` or the settings dashboard. Deletion permanently removes profile details, claims, mentor requests, and notifications.

---

## 7. Security Safeguards

- Session tokens use cryptographic signing with secure, HttpOnly, and SameSite cookie policies.
- Ingestion endpoints enforce HMAC SHA-256 signature verification and delivery idempotency.
- Role-based authorization is verified server-side against fresh database state for all privileged operations.

---

## 8. Responsible Entity & Contact Information

| Detail | Status / Placeholder |
| :--- | :--- |
| **Operating Entity** | TechNexusOrg Community Initiative *(Formal MSME / legal entity registration in progress)* |
| **Jurisdiction** | Uttarakhand, India |
| **Privacy Officer** | `privacy@technexus.org` *(placeholder until official domain email is provisioned)* |
| **Security Reports** | Please refer to [SECURITY.md](SECURITY.md) |

---

*Last revised: October 2026. This policy will be updated as formal institutional and community registrations are finalized.*
