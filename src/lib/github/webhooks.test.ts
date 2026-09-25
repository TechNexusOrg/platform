import { describe, it, expect } from "vitest";
import { verifyWebhookSignature } from "./webhooks";
import crypto from "crypto";

describe("GitHub Webhook Signature Verification", () => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "dev_webhook_secret_key";
  const payload = JSON.stringify({ action: "closed", pull_request: { merged: true } });

  it("verifies valid HMAC SHA256 signature", () => {
    const signature = `sha256=${crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")}`;

    const isValid = verifyWebhookSignature(payload, signature);
    expect(isValid).toBe(true);
  });

  it("rejects forged or modified payload", () => {
    const signature = `sha256=${crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")}`;

    const modifiedPayload = JSON.stringify({ action: "closed", pull_request: { merged: false } });
    const isValid = verifyWebhookSignature(modifiedPayload, signature);
    expect(isValid).toBe(false);
  });

  it("rejects missing or malformed signature header", () => {
    expect(verifyWebhookSignature(payload, null)).toBe(false);
    expect(verifyWebhookSignature(payload, "invalid_sig")).toBe(false);
  });
});
