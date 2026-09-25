import crypto from "crypto";
import { env } from "@/lib/env";

export function verifyWebhookSignature(payloadBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const secret = env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payloadBody)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export interface WebhookPullRequestEvent {
  action: "opened" | "closed" | "reopened" | "synchronize";
  pull_request: {
    id: number;
    number: number;
    title: string;
    html_url: string;
    state: "open" | "closed";
    merged: boolean;
    merged_at: string | null;
    user: {
      id: number;
      login: string;
      avatar_url: string;
    };
    base: {
      repo: {
        id: number;
        name: string;
        full_name: string;
        html_url: string;
      };
    };
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  sender: {
    id: number;
    login: string;
  };
}
