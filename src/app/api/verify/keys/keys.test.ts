import { describe, it, expect } from "vitest";
import { GET as getKeysHandler } from "./route";

describe("Public JWKS Key Discovery Endpoint", () => {
  it("GET /api/verify/keys returns Ed25519 public keys with cache headers", async () => {
    const res = await getKeysHandler();
    expect(res.status).toBe(200);

    const cacheHeader = res.headers.get("cache-control");
    expect(cacheHeader).toContain("public");

    const data = await res.json();
    expect(data.keys).toBeDefined();
    expect(data.keys.length).toBeGreaterThanOrEqual(1);

    const primaryKey = data.keys[0];
    expect(primaryKey.kty).toBe("OKP");
    expect(primaryKey.crv).toBe("Ed25519");
    expect(primaryKey.alg).toBe("EdDSA");
    expect(primaryKey.use).toBe("sig");
    expect(primaryKey.kid).toBeDefined();
    expect(primaryKey.x).toBeDefined();
  });
});
