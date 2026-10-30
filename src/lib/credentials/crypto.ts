import crypto from "crypto";

export interface CredentialSignatureResult {
  signature: string;
  signingKeyId: string;
  canonicalHash: string;
}

export interface JWKKey {
  kty: "OKP";
  crv: "Ed25519";
  kid: string;
  x: string;
  use: "sig";
  alg: "EdDSA";
}

const DEFAULT_KEY_ID = "tn-ed25519-2026-v1";

// Cache in-memory keypair for execution lifecycle
let activePrivateKey: crypto.KeyObject | null = null;
let activePublicKey: crypto.KeyObject | null = null;

/**
 * Initializes or retrieves the active Ed25519 keypair.
 */
function getKeyPair(): { privateKey: crypto.KeyObject; publicKey: crypto.KeyObject } {
  if (activePrivateKey && activePublicKey) {
    return { privateKey: activePrivateKey, publicKey: activePublicKey };
  }

  const envPrivateKeyPem = process.env.CREDENTIAL_SIGNING_PRIVATE_KEY;
  const envPublicKeyPem = process.env.CREDENTIAL_SIGNING_PUBLIC_KEY;

  if (envPrivateKeyPem && envPublicKeyPem) {
    try {
      activePrivateKey = crypto.createPrivateKey(envPrivateKeyPem);
      activePublicKey = crypto.createPublicKey(envPublicKeyPem);
      return { privateKey: activePrivateKey, publicKey: activePublicKey };
    } catch (err: any) {
      console.warn("Failed to load environment Ed25519 keys, falling back to generated keys:", err.message);
    }
  }

  // Generate ephemeral/runtime keypair
  const pair = crypto.generateKeyPairSync("ed25519");
  activePrivateKey = pair.privateKey;
  activePublicKey = pair.publicKey;
  return { privateKey: activePrivateKey, publicKey: activePublicKey };
}

/**
 * Deterministically sorts and canonicalizes an object to JSON format.
 */
export function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => canonicalize(item)).join(",") + "]";
  }

  const sortedKeys = Object.keys(obj).sort();
  const pairs: string[] = [];

  for (const key of sortedKeys) {
    const val = obj[key];
    if (val !== undefined && typeof val !== "function") {
      pairs.push(`${JSON.stringify(key)}:${canonicalize(val)}`);
    }
  }

  return "{" + pairs.join(",") + "}";
}

/**
 * Computes a SHA-256 digest over the canonical representation of a payload.
 */
export function computeCanonicalHash(payload: any): string {
  const canonical = canonicalize(payload);
  return crypto.createHash("sha256").update(canonical, "utf-8").digest("hex");
}

/**
 * Signs a credential claims payload using Ed25519 digital signature.
 */
export function signCredentialPayload(
  payload: any,
  keyId = DEFAULT_KEY_ID
): CredentialSignatureResult {
  const { privateKey } = getKeyPair();
  const canonical = canonicalize(payload);
  const canonicalHash = crypto.createHash("sha256").update(canonical, "utf-8").digest("hex");

  const signature = crypto
    .sign(null, Buffer.from(canonical, "utf-8"), privateKey)
    .toString("base64");

  return {
    signature,
    signingKeyId: keyId,
    canonicalHash,
  };
}

/**
 * Verifies an Ed25519 digital signature against a credential claims payload.
 */
export function verifyCredentialSignature(
  payload: any,
  signatureBase64: string,
  _keyId = DEFAULT_KEY_ID
): boolean {
  try {
    const { publicKey } = getKeyPair();
    const canonical = canonicalize(payload);
    const signatureBuffer = Buffer.from(signatureBase64, "base64");

    return crypto.verify(
      null,
      Buffer.from(canonical, "utf-8"),
      publicKey,
      signatureBuffer
    );
  } catch (err: any) {
    console.error("Signature verification error:", err.message);
    return false;
  }
}

/**
 * Returns public JWKS discovery document for verification by third parties.
 */
export function getPublicJWKS(keyId = DEFAULT_KEY_ID): { keys: JWKKey[] } {
  const { publicKey } = getKeyPair();
  const jwk = publicKey.export({ format: "jwk" }) as any;

  return {
    keys: [
      {
        kty: "OKP",
        crv: "Ed25519",
        kid: keyId,
        x: jwk.x,
        use: "sig",
        alg: "EdDSA",
      },
    ],
  };
}

/**
 * Returns public key in PEM format.
 */
export function getPublicKeyPem(): string {
  const { publicKey } = getKeyPair();
  return publicKey.export({ format: "pem", type: "spki" }) as string;
}
