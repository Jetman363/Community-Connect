import { describe, it, expect } from "vitest";
import { safeParseJson } from "@/lib/ai/json-utils";

describe("safeParseJson", () => {
  it("parses valid JSON", () => {
    expect(safeParseJson('{"a":1}', {})).toEqual({ a: 1 });
  });

  it("returns fallback on invalid JSON", () => {
    expect(safeParseJson("{bad", { ok: true })).toEqual({ ok: true });
  });
});
