import { NextResponse } from "next/server";
import { getPublicJWKS } from "@/lib/credentials/crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const jwks = getPublicJWKS();
  return NextResponse.json(jwks, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
