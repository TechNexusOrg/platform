import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  handlePullRequestWebhook,
  handlePullRequestReviewWebhook,
  recordWebhookDelivery,
  markWebhookDeliveryProcessed,
  markWebhookDeliveryIgnored,
  markWebhookDeliveryError,
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

  let repoName: string | undefined;
  try {
    const parsed = JSON.parse(rawBody);
    repoName = parsed.repository?.full_name;
  } catch {
    // raw payload may be empty or invalid json
  }

  // Idempotency state machine check & record
  if (deliveryId) {
    const delivery = await recordWebhookDelivery({
      deliveryId,
      eventType: event || "unknown",
      repository: repoName,
    });

    if (!delivery.shouldProcess) {
      return NextResponse.json({
        message: "Duplicate or in-flight delivery ignored",
        deliveryId,
        status: delivery.status,
      });
    }
  }

  // Handle ping event
  if (event === "ping") {
    if (deliveryId) {
      await markWebhookDeliveryIgnored(deliveryId, "ping");
    }
    return NextResponse.json({ message: "PONG" });
  }

  // Unsupported events become 'ignored'
  if (event !== "pull_request" && event !== "pull_request_review") {
    if (deliveryId) {
      await markWebhookDeliveryIgnored(deliveryId, `Unsupported event: ${event}`);
    }
    return NextResponse.json({
      ignored: true,
      reason: `Unsupported event: ${event}`,
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
      if (result.handled === false) {
        await markWebhookDeliveryIgnored(deliveryId, result.reason || "unhandled");
      } else {
        await markWebhookDeliveryProcessed(deliveryId);
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    if (deliveryId) {
      await markWebhookDeliveryError(deliveryId, err.message);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
