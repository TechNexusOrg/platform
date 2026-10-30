import { describe, it, expect } from "vitest";
import {
  canonicalize,
  computeCanonicalHash,
  signCredentialPayload,
  verifyCredentialSignature,
  getPublicJWKS,
  getPublicKeyPem,
} from "./crypto";

describe("Ed25519 Cryptographic Infrastructure", () => {
  it("canonicalizes JSON deterministically regardless of key order", () => {
    const objA = {
      b: 2,
      a: 1,
      nested: { z: 26, y: 25 },
      list: [3, 2, 1],
    };

    const objB = {
      nested: { y: 25, z: 26 },
      a: 1,
      list: [3, 2, 1],
      b: 2,
    };

    const strA = canonicalize(objA);
    const strB = canonicalize(objB);

    expect(strA).toBe(strB);
    expect(computeCanonicalHash(objA)).toBe(computeCanonicalHash(objB));
  });

  it("signs and verifies credential claims using Ed25519", () => {
    const claims = {
      credentialId: "cred_tn_firstpr_test123",
      recipient: "usr_alice",
      type: "first_pr_merged",
      repository: "TechNexusOrg/platform",
      prNumber: 12,
      issuedAt: "2026-10-30T00:00:00.000Z",
    };

    const { signature, signingKeyId, canonicalHash } = signCredentialPayload(claims);

    expect(signature).toBeDefined();
    expect(signature.length).toBeGreaterThan(60);
    expect(signingKeyId).toContain("tn-ed25519");
    expect(canonicalHash.length).toBe(64);

    // Verification must pass with exact payload
    const isValid = verifyCredentialSignature(claims, signature, signingKeyId);
    expect(isValid).toBe(true);
  });

  it("detects payload tampering and rejects invalid signatures", () => {
    const claims = {
      credentialId: "cred_tn_firstpr_test456",
      recipient: "usr_bob",
      prNumber: 42,
    };

    const { signature } = signCredentialPayload(claims);

    // Tampered payload
    const tamperedClaims = {
      ...claims,
      prNumber: 99, // Tampered PR number
    };

    const isValidTampered = verifyCredentialSignature(tamperedClaims, signature);
    expect(isValidTampered).toBe(false);

    // Corrupted signature
    const corruptedSignature = signature.slice(0, -4) + "AAAA";
    const isValidCorrupted = verifyCredentialSignature(claims, corruptedSignature);
    expect(isValidCorrupted).toBe(false);
  });

  it("exports valid public JWKS discovery document", () => {
    const jwks = getPublicJWKS();
    expect(jwks.keys).toBeDefined();
    expect(jwks.keys.length).toBeGreaterThanOrEqual(1);

    const key = jwks.keys[0];
    expect(key.kty).toBe("OKP");
    expect(key.crv).toBe("Ed25519");
    expect(key.use).toBe("sig");
    expect(key.alg).toBe("EdDSA");
    expect(key.x).toBeDefined();

    const pem = getPublicKeyPem();
    expect(pem).toContain("PUBLIC KEY");
  });
});
