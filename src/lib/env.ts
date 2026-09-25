import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters long")
    .default("development_secret_key_strictly_for_local_testing_min_32_chars"),
  GITHUB_CLIENT_ID: z.string().default("mock_client_id_for_dev"),
  GITHUB_CLIENT_SECRET: z.string().default("mock_client_secret_for_dev"),
  GITHUB_ACCESS_TOKEN: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().default("dev_webhook_secret_key"),
  DATABASE_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(customEnv?: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(customEnv || process.env);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    throw new Error(`Environment validation failed: ${errors}`);
  }
  return result.data;
}

export const env = validateEnv();
