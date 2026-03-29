import { describe, it, expect } from "vitest";
import { tokenize } from "../../../src/domain.js";

describe("tokenize", () => {
  it("splits text into lowercase tokens", () => {
    expect(tokenize("Hello World")).toEqual(["hello", "world"]);
  });

  it("filters out short tokens (< 2 chars)", () => {
    expect(tokenize("I am a dev")).toEqual(["am", "dev"]);
  });

  it("handles special characters as separators but preserves hyphens", () => {
    expect(tokenize("use-postgres, not mongo!")).toEqual(["use-postgres", "not", "mongo"]);
  });

  it("returns empty array for empty input", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize(null)).toEqual([]);
    expect(tokenize(undefined)).toEqual([]);
  });

  it("limits to 40 tokens", () => {
    const long = Array.from({ length: 50 }, (_, i) => `word${i}`).join(" ");
    expect(tokenize(long)).toHaveLength(40);
  });

  it("preserves hyphens and underscores in tokens", () => {
    expect(tokenize("my-var my_func")).toEqual(["my-var", "my_func"]);
  });
});
