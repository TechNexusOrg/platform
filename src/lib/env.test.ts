import { describe, it, expect } from "vitest";
import { validateEnv, safeCompare } from "./env";

describe("Environment Validation", () => {
  it("validates default development environment safely", () => {
    const valid = validateEnv({
      NODE_ENV: "development",
      APP_URL: "http://localhost:3000",
      AUTH_SECRET: "12345678901234567890123456789012",
      INTERNAL_SERVICE_SECRET: "12345678901234567890123456789012",
      GITHUB_CLIENT_ID: "mock_id",
      GITHUB_CLIENT_SECRET: "mock_secret",
      GITHUB_WEBHOOK_SECRET: "test_secret",
    });

    expect(valid.NODE_ENV).toBe("development");
    expect(valid.APP_URL).toBe("http://localhost:3000");
    expect(valid.AUTH_SECRET).toHaveLength(32);
    expect(valid.TECH_NEXUS_ORG_ID).toBe(333899669);
    expect(valid.TECH_NEXUS_ORG_NAME).toBe("TechNexusOrg");
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

  describe("Production Hardening & Fail-Closed Guardrails", () => {
    it("fails in production if known dev placeholder AUTH_SECRET is used", () => {
      expect(() =>
        validateEnv({
          NODE_ENV: "production",
          APP_URL: "https://platform.technexus.org",
          AUTH_SECRET: "development_secret_key_strictly_for_local_testing_min_32_chars",
          INTERNAL_SERVICE_SECRET: "strong_production_service_secret_999999999999",
          GITHUB_CLIENT_ID: "valid_client_id_12345",
          GITHUB_CLIENT_SECRET: "valid_client_secret_9876543210",
          GITHUB_WEBHOOK_SECRET: "strong_webhook_secret_123456",
          DATABASE_URL: "postgresql://postgres:secret@db.host.internal:5432/technexus",
        })
      ).toThrow(/Production requires a strong, random AUTH_SECRET/);
    });

    it("fails in production if GITHUB_CLIENT_ID is a mock placeholder", () => {
      expect(() =>
        validateEnv({
          NODE_ENV: "production",
          APP_URL: "https://platform.technexus.org",
          AUTH_SECRET: "strong_production_auth_secret_111111111111111",
          INTERNAL_SERVICE_SECRET: "strong_production_service_secret_999999999999",
          GITHUB_CLIENT_ID: "mock_client_id_for_dev",
          GITHUB_CLIENT_SECRET: "valid_client_secret_9876543210",
          GITHUB_WEBHOOK_SECRET: "strong_webhook_secret_123456",
          DATABASE_URL: "postgresql://postgres:secret@db.host.internal:5432/technexus",
        })
      ).toThrow(/Production requires a valid GITHUB_CLIENT_ID/);
    });

    it("fails in production if DATABASE_URL is missing or invalid", () => {
      expect(() =>
        validateEnv({
          NODE_ENV: "production",
          APP_URL: "https://platform.technexus.org",
          AUTH_SECRET: "strong_production_auth_secret_111111111111111",
          INTERNAL_SERVICE_SECRET: "strong_production_service_secret_999999999999",
          GITHUB_CLIENT_ID: "valid_client_id_12345",
          GITHUB_CLIENT_SECRET: "valid_client_secret_9876543210",
          GITHUB_WEBHOOK_SECRET: "strong_webhook_secret_123456",
          DATABASE_URL: "",
        })
      ).toThrow(/Production requires a valid PostgreSQL DATABASE_URL/);
    });

    it("passes in production when all security requirements are satisfied", () => {
      const valid = validateEnv({
        NODE_ENV: "production",
        APP_URL: "https://platform.technexus.org",
        AUTH_SECRET: "strong_production_auth_secret_111111111111111",
        INTERNAL_SERVICE_SECRET: "strong_production_service_secret_999999999999",
        GITHUB_CLIENT_ID: "valid_client_id_12345",
        GITHUB_CLIENT_SECRET: "valid_client_secret_9876543210",
        GITHUB_WEBHOOK_SECRET: "strong_webhook_secret_123456",
        DATABASE_URL: "postgresql://postgres:secret@db.host.internal:5432/technexus",
      });

      expect(valid.NODE_ENV).toBe("production");
      expect(valid.DATABASE_URL).toContain("postgresql://");
    });
  });

  describe("safeCompare", () => {
    it("returns true for matching strings in constant time", () => {
      expect(safeCompare("super_secret_token_123", "super_secret_token_123")).toBe(true);
    });

    it("returns false for non-matching strings", () => {
      expect(safeCompare("super_secret_token_123", "wrong_token_456")).toBe(false);
      expect(safeCompare("super_secret_token_123", "super_secret_token_124")).toBe(false);
    });

    it("returns false safely when strings differ in length or are missing", () => {
      expect(safeCompare("short", "longer_string")).toBe(false);
      expect(safeCompare(null, "some_token")).toBe(false);
      expect(safeCompare("some_token", undefined)).toBe(false);
    });
  });
});
