import { describe, it, expect } from "vitest";
import { scoreItem } from "../../../src/domain.js";

describe("scoreItem", () => {
  const item = {
    title: "Use PostgreSQL for database",
    content: "We chose PostgreSQL over MongoDB for relational data",
    tags: ["database", "infrastructure"],
  };

  it("scores query matches at +3 per token", () => {
    const score = scoreItem(item, ["postgresql"], []);
    expect(score).toBe(3);
  });

  it("scores multiple query matches", () => {
    const score = scoreItem(item, ["postgresql", "mongodb"], []);
    expect(score).toBe(6);
  });

  it("scores tag matches at +4 per tag", () => {
    const score = scoreItem(item, [], ["database"]);
    expect(score).toBe(4);
  });

  it("scores both query and tag matches", () => {
    const score = scoreItem(item, ["postgresql"], ["database"]);
    expect(score).toBe(7);
  });

  it("returns 0 for no matches", () => {
    const score = scoreItem(item, ["redis"], ["caching"]);
    expect(score).toBe(0);
  });

  it("is case-insensitive for query matching", () => {
    const score = scoreItem(item, ["POSTGRESQL"], []);
    expect(score).toBe(0); // tokens should be lowercase
  });

  it("matches lowercase query tokens against content", () => {
    const score = scoreItem(item, ["postgresql"], []);
    expect(score).toBe(3);
  });
});
