import { describe, expect, it } from "../test-api.ts";
import {
  formatLabel,
  getQueryOption,
  getQueryValue,
  getQueryValues,
  parseDateToMs,
  replaceQuery,
  toggleValue,
} from "../../src/utils/collections";
import { getString, getStringArray, isValidSlug } from "../../src/utils/content";

describe("collection utilities", () => {
  it("parses dates and formats labels", () => {
    expect(parseDateToMs("02.01.2026")).toBeGreaterThan(
      parseDateToMs("01.01.2026"),
    );
    expect(parseDateToMs("invalid")).toBe(0);
    expect(formatLabel("security-research")).toBe("Security Research");
  });

  it("reads, validates, and replaces query parameters", () => {
    window.history.replaceState(
      null,
      "",
      "/work?q=security&category=web,network&sort=oldest",
    );

    expect(getQueryValue("q")).toBe("security");
    expect(getQueryValues("category")).toEqual(["web", "network"]);
    expect(getQueryOption("sort", ["newest", "oldest"] as const, "newest")).toBe(
      "oldest",
    );

    replaceQuery({ q: " new query ", category: ["web"], sort: "" });
    expect(window.location.search).toBe("?q=new+query&category=web");
  });

  it("toggles selected values", () => {
    expect(toggleValue(["web"], "network")).toEqual(["web", "network"]);
    expect(toggleValue(["web", "network"], "web")).toEqual(["network"]);
  });
});

describe("content utilities", () => {
  it("validates slugs and normalizes frontmatter values", () => {
    expect(isValidSlug("safe-project_01")).toBe(true);
    expect(isValidSlug("../unsafe")).toBe(false);
    expect(isValidSlug("a".repeat(101))).toBe(false);
    expect(getString("value")).toBe("value");
    expect(getString(["value"])).toBe("");
    expect(getStringArray("value")).toEqual(["value"]);
    expect(getStringArray(["one", "two"])).toEqual(["one", "two"]);
  });
});
