import { describe, it, expect } from "vitest";
import { validateEnv } from "./env";

describe("Environment Validation", () => {
  it("validates default development environment safely", () => {
    const valid = validateEnv({
      NODE_ENV: "development",
      APP_URL: "http://localhost:3000",
      AUTH_SECRET: "12345678901234567890123456789012",
      GITHUB_CLIENT_ID: "mock_id",
      GITHUB_CLIENT_SECRET: "mock_secret",
      GITHUB_WEBHOOK_SECRET: "test_secret",
    });

    expect(valid.NODE_ENV).toBe("development");
    expect(valid.APP_URL).toBe("http://localhost:3000");
    expect(valid.AUTH_SECRET).toHaveLength(32);
  });

  it("fails if AUTH_SECRET is shorter than 32 characters", () => {
    expect(() =>
      validateEnv({
        NODE_ENV: "development",
        APP_URL: "http://localhost:3000",
        AUTH_SECRET: "too_short",
      })
    ).toThrow(/AUTH_SECRET must be at least 32 characters long/);
  });

  it("fails if APP_URL is invalid", () => {
    expect(() =>
      validateEnv({
        APP_URL: "not-a-valid-url",
        AUTH_SECRET: "12345678901234567890123456789012",
      })
    ).toThrow();
  });
});
