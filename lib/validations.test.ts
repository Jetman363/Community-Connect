import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, connectSocialLinkSchema } from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("requires minimum password length", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
      displayName: "Test User",
    });
    expect(result.success).toBe(false);
  });
});

describe("connectSocialLinkSchema", () => {
  it("accepts valid platform and URL", () => {
    const result = connectSocialLinkSchema.safeParse({
      platform: "INSTAGRAM",
      profileUrl: "https://instagram.com/user",
      username: "user",
    });
    expect(result.success).toBe(true);
  });
});
