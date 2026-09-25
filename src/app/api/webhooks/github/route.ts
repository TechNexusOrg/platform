import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  handlePullRequestWebhook,
  handlePullRequestReviewWebhook,
  isWebhookDeliveryProcessed,
  recordWebhookDelivery,
  markWebhookDeliveryCompleted,
  markWebhookDeliveryFailed,
  type WebhookPullRequestEvent,
  type WebhookPullRequestReviewEvent,
} from "@/lib/github/webhooks";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");
  const deliveryId = request.headers.get("x-github-delivery");
  const rawBody = await request.text();

  // Validate webhook secret signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event === "ping") {
    return NextResponse.json({ message: "PONG" });
  }

  // Idempotency: Ignore duplicate webhook deliveries
  if (deliveryId) {
    const alreadyProcessed = await isWebhookDeliveryProcessed(deliveryId);
    if (alreadyProcessed) {
      return NextResponse.json({
        message: "Duplicate webhook delivery ignored",
        deliveryId,
      });
    }

    let repoName: string | undefined;
    try {
      const parsed = JSON.parse(rawBody);
      repoName = parsed.repository?.full_name;
    } catch {
      // ignore
    }

    await recordWebhookDelivery({
      deliveryId,
      eventType: event || "unknown",
      repository: repoName,
    });
  }

  try {
    let result: any = { received: true, event };

    if (event === "pull_request") {
      const payload = JSON.parse(rawBody) as WebhookPullRequestEvent;
      result = await handlePullRequestWebhook(payload);
    } else if (event === "pull_request_review") {
      const payload = JSON.parse(rawBody) as WebhookPullRequestReviewEvent;
      result = await handlePullRequestReviewWebhook(payload);
    }

    if (deliveryId) {
      await markWebhookDeliveryCompleted(deliveryId);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    if (deliveryId) {
      await markWebhookDeliveryFailed(deliveryId, err.message);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
