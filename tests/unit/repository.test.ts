import { describe, expect, it } from "../test-api.ts";
import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { basename, join } from "node:path";
import { parseFrontmatter } from "../../src/utils/frontmatter";

type IndexedContent = {
  slug: string;
  title: string;
  [key: string]: unknown;
};

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function markdownSlugs(directory: string): string[] {
  return readdirSync(directory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => basename(file, ".md"))
    .sort();
}

function expectUnique(values: string[]) {
  expect(new Set(values).size).toBe(values.length);
}

function expectIndexedSourcesExist(indexedSlugs: string[], sourceSlugs: string[]) {
  for (const slug of indexedSlugs) {
    expect(sourceSlugs, slug).toContain(slug);
  }
}

describe("repository content integrity", () => {
  it("keeps every project index entry synchronized with a markdown page", () => {
    const directory = "public/projects";
    const index = readJson<IndexedContent[]>(join(directory, "index.json"));
    const indexedSlugs = index.map((entry) => entry.slug).sort();

    expect(index.length).toBeGreaterThan(0);
    expectUnique(indexedSlugs);
    expectIndexedSourcesExist(indexedSlugs, markdownSlugs(directory));

    for (const entry of index) {
      const raw = readFileSync(join(directory, `${entry.slug}.md`), "utf8");
      const { metadata, content } = parseFrontmatter(raw);
      expect(metadata.title, entry.slug).toBe(entry.title);
      expect(
        content.trim().length > 0 || String(metadata.summary || "").length > 0,
        entry.slug,
      ).toBe(true);
      if (entry.image) expect(existsSync(join("public", String(entry.image)))).toBe(true);
    }
  });

  it("keeps every writing index entry synchronized with a markdown page", () => {
    const directory = "public/writing/entries";
    const index = readJson<IndexedContent[]>("public/writing/index.json");
    const indexedSlugs = index.map((entry) => entry.slug).sort();

    expect(index.length).toBeGreaterThan(0);
    expectUnique(indexedSlugs);
    expectIndexedSourcesExist(indexedSlugs, markdownSlugs(directory));

    for (const entry of index) {
      const raw = readFileSync(join(directory, `${entry.slug}.md`), "utf8");
      const { metadata, content } = parseFrontmatter(raw);
      expect(metadata.title, entry.slug).toBe(entry.title);
      expect(content.trim().length, entry.slug).toBeGreaterThan(0);
    }
  });

  it("keeps every toolbox entry connected to a standalone tool page", () => {
    const tools = readJson<Array<{ id: string; title: string; url: string }>>(
      "public/toolbox/index.json",
    );
    expect(tools.length).toBeGreaterThan(0);
    expectUnique(tools.map((tool) => tool.id));

    for (const tool of tools) {
      const relativeUrl = tool.url.replace(/^\/+/, "").replace(/\/+$/, "");
      const indexPath = join("public", relativeUrl, "index.html");
      expect(existsSync(indexPath), tool.url).toBe(true);
      expect(readFileSync(indexPath, "utf8"), tool.url).toContain(
        '<script type="module" src="./app.js"></script>',
      );
      expect(existsSync(join("public", relativeUrl, "app.js")), tool.url).toBe(true);
    }
  });

  it("keeps source routes and fallback pages connected to current destinations", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    const expectedRoutes = ["/", "/work", "/writing", "/tools", "/about"];

    for (const route of expectedRoutes) {
      expect(app).toContain(`path="${route}"`);
    }
    expect(app).toContain("default component={NotFound}");

    if (existsSync("404.html")) {
      const fallback = readFileSync("404.html", "utf8");
      expect(fallback).toContain("Page not found.");
      expect(fallback).toContain("/assets/brand/me.svg");
    }
  });
});
