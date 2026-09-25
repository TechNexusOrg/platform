import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken, type SessionUser } from "./session";

describe("Session Management", () => {
  const dummyUser: SessionUser = {
    id: "usr_test_123",
    githubId: 12345678,
    githubUsername: "ashishsinghbora",
    displayName: "Ashish Singh",
    email: "ashish@example.com",
    avatarUrl: "https://github.com/ashishsinghbora.png",
    role: "admin",
    level: "core_contributor",
    isOnboarded: true,
    foundingNumber: 1,
  };

  it("creates a signed JWT and correctly verifies it", async () => {
    const token = await createSessionToken(dummyUser);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(dummyUser.id);
    expect(verified?.githubUsername).toBe(dummyUser.githubUsername);
    expect(verified?.role).toBe("admin");
    expect(verified?.level).toBe("core_contributor");
    expect(verified?.isOnboarded).toBe(true);
    expect(verified?.foundingNumber).toBe(1);
  });

  it("returns null for tampered or invalid tokens", async () => {
    const token = await createSessionToken(dummyUser);
    const tampered = token.slice(0, -5) + "ABCDE";
    const result = await verifySessionToken(tampered);
    expect(result).toBeNull();
  });
});
