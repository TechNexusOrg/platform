import { z } from "zod";
import crypto from "crypto";

const FORBIDDEN_PROD_AUTH_SECRETS = [
  "development_secret_key_strictly_for_local_testing_min_32_chars",
  "ci_build_dummy_secret_key_strictly_for_testing_32_chars",
  "12345678901234567890123456789012",
  "00000000000000000000000000000000",
  "changeme_changeme_changeme_changeme",
];

const FORBIDDEN_PROD_SERVICE_SECRETS = [
  "dev_internal_service_key_strictly_for_local_testing_min_32_chars",
  "12345678901234567890123456789012",
  "changeme_changeme_changeme_changeme",
];

const FORBIDDEN_PROD_WEBHOOK_SECRETS = [
  "dev_webhook_secret_key",
  "test_secret",
  "webhook_secret",
  "changeme",
];

export function createEnvSchema(isExplicitCustomEnv = false) {
  return z
    .object({
      NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
      CI: z.string().optional(),
      APP_URL: z.string().url().default("http://localhost:3000"),
      AUTH_SECRET: z
        .string()
        .min(32, "AUTH_SECRET must be at least 32 characters long")
        .default("development_secret_key_strictly_for_local_testing_min_32_chars"),
      INTERNAL_SERVICE_SECRET: z
        .string()
        .min(32, "INTERNAL_SERVICE_SECRET must be at least 32 characters long")
        .default("dev_internal_service_key_strictly_for_local_testing_min_32_chars"),
      GITHUB_CLIENT_ID: z.string().default("mock_client_id_for_dev"),
      GITHUB_CLIENT_SECRET: z.string().default("mock_client_secret_for_dev"),
      GITHUB_ACCESS_TOKEN: z.string().optional(),
      GITHUB_WEBHOOK_SECRET: z.string().default("dev_webhook_secret_key"),
      DATABASE_URL: z.string().optional(),
      TECH_NEXUS_ORG_ID: z.coerce.number().default(333899669),
      TECH_NEXUS_ORG_NAME: z.string().default("TechNexusOrg"),
    })
    .superRefine((data, ctx) => {
      // Production runtime fail-closed validations
      // During Next.js compile/build phase without custom env, permit build to complete
      const isProduction = data.NODE_ENV === "production";
      const isCI = data.CI === "true" || data.CI === "1";
      const isBuildPhase =
        (process.env.NEXT_PHASE === "phase-production-build" ||
          process.env.npm_lifecycle_event === "build") &&
        !isExplicitCustomEnv;

      if (isProduction && !isCI && !isBuildPhase) {
        // 1. Production JWT Auth Secret must not be a known development placeholder
        if (FORBIDDEN_PROD_AUTH_SECRETS.includes(data.AUTH_SECRET)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["AUTH_SECRET"],
            message: "Production requires a strong, random AUTH_SECRET. Known dev placeholders are rejected.",
          });
        }

        // 2. Production Internal Service Secret must not be a known placeholder
        if (FORBIDDEN_PROD_SERVICE_SECRETS.includes(data.INTERNAL_SERVICE_SECRET)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["INTERNAL_SERVICE_SECRET"],
            message:
              "Production requires a strong, random INTERNAL_SERVICE_SECRET. Known dev placeholders are rejected.",
          });
        }

        // 3. GitHub OAuth credentials must be real credentials, not development mocks
        if (data.GITHUB_CLIENT_ID.startsWith("mock_") || data.GITHUB_CLIENT_ID.length < 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["GITHUB_CLIENT_ID"],
            message: "Production requires a valid GITHUB_CLIENT_ID. Mock placeholders are rejected.",
          });
        }

        if (data.GITHUB_CLIENT_SECRET.startsWith("mock_") || data.GITHUB_CLIENT_SECRET.length < 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["GITHUB_CLIENT_SECRET"],
            message: "Production requires a valid GITHUB_CLIENT_SECRET. Mock placeholders are rejected.",
          });
        }

        // 4. Webhook secret must not be a placeholder
        if (FORBIDDEN_PROD_WEBHOOK_SECRETS.includes(data.GITHUB_WEBHOOK_SECRET)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["GITHUB_WEBHOOK_SECRET"],
            message: "Production requires a secure GITHUB_WEBHOOK_SECRET. Default dev secret is rejected.",
          });
        }

        // 5. Database URL must be mandatory PostgreSQL in production
        if (
          !data.DATABASE_URL ||
          (!data.DATABASE_URL.startsWith("postgres://") &&
            !data.DATABASE_URL.startsWith("postgresql://") &&
            !data.DATABASE_URL.startsWith("postgres:"))
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["DATABASE_URL"],
            message: "Production requires a valid PostgreSQL DATABASE_URL. Local PGlite is disabled in production.",
          });
        }
      }
    });
}

export type Env = z.infer<ReturnType<typeof createEnvSchema>>;

/**
 * Validates the runtime environment against strict production invariants.
 */
export function validateEnv(customEnv?: Record<string, string | undefined>): Env {
  const schema = createEnvSchema(Boolean(customEnv));
  const result = schema.safeParse(customEnv || process.env);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    throw new Error(`Environment validation failed: ${errors}`);
  }
  return result.data;
}

/**
 * Constant-time string comparison to prevent timing attacks against secret-based authentication.
 */
export function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export const env = validateEnv();
