import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeSlug, sanitizeEmail } from "@/lib/security/sanitize";

describe("sanitizeText", () => {
  it("strips HTML tags", () => {
    expect(sanitizeText("<script>alert(1)</script>hello")).toBe("alert(1)hello");
  });

  it("trims and limits length", () => {
    expect(sanitizeText("  hi  ", 2)).toBe("hi");
  });
});

describe("sanitizeSlug", () => {
  it("removes invalid characters", () => {
    expect(sanitizeSlug("hello world!")).toBe("helloworld");
  });
});

describe("sanitizeEmail", () => {
  it("lowercases email", () => {
    expect(sanitizeEmail("  User@Example.COM  ")).toBe("user@example.com");
  });
});
