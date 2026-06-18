import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter, type Frontmatter } from "../src/utils/frontmatter";

const checkOnly = process.argv.includes("--check");

type IndexConfig<T> = {
  dir: string;
  output: string;
  label: string;
  map: (file: string, metadata: Frontmatter) => T | null;
};

type ProjectIndexItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  date: string;
  url: string;
  image: string;
  imageAlt: string;
  tags: string[];
  category: string;
  type: string;
  status: string;
  featured: boolean;
};

type WritingIndexItem = {
  title: string;
  date: string;
  slug: string;
  id: string;
  week: string;
  summary: string;
  tags: string[];
  featured: boolean;
};

function text(metadata: Frontmatter, key: string, fallback = "") {
  const value = metadata[key];
  return typeof value === "string" ? value : fallback;
}

function list(metadata: Frontmatter, key: string) {
  const value = metadata[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : [];
}

function flag(metadata: Frontmatter, key: string) {
  return text(metadata, key) === "true";
}

function slug(file: string) {
  return file.replace(/\.md$/, "");
}

function dateMs(date: string) {
  const [dd, mm, yyyy] = date.split(".").map(Number);
  if (!dd || !mm || !yyyy) return 0;
  return Date.UTC(yyyy, mm - 1, dd);
}

function generate<T extends { date?: string }>(config: IndexConfig<T>) {
  const items = readdirSync(config.dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const raw = readFileSync(join(config.dir, file), "utf8");
      return config.map(file, parseFrontmatter(raw).metadata);
    })
    .filter((item): item is T => item !== null)
    .sort((a, b) => dateMs(b.date || "") - dateMs(a.date || ""));

  const json = `${JSON.stringify(items, null, 2)}\n`;

  if (checkOnly) {
    const current = existsSync(config.output)
      ? readFileSync(config.output, "utf8")
      : "";
    if (current !== json) {
      console.error(`${config.output} is stale. Run bun run generate:indexes.`);
      process.exitCode = 1;
    }
    return;
  }

  writeFileSync(config.output, json);
  console.log(`Updated ${config.output} with ${items.length} ${config.label}`);
}

generate<ProjectIndexItem>({
  dir: "public/projects",
  output: "public/projects/index.json",
  label: "projects",
  map: (file, metadata) => {
    const id = text(metadata, "id");
    if (!id) return null;

    return {
      id,
      slug: slug(file),
      title: text(metadata, "title"),
      subtitle: text(metadata, "subtitle"),
      summary: text(metadata, "summary"),
      date: text(metadata, "date"),
      url: text(metadata, "url"),
      image: text(metadata, "image"),
      imageAlt: text(metadata, "imageAlt"),
      tags: list(metadata, "tags"),
      category: text(metadata, "category"),
      type: text(metadata, "type"),
      status: text(metadata, "status", "complete"),
      featured: flag(metadata, "featured"),
    };
  },
});

generate<WritingIndexItem>({
  dir: "public/writing/entries",
  output: "public/writing/index.json",
  label: "entries",
  map: (file, metadata) => ({
    title: text(metadata, "title"),
    date: text(metadata, "date"),
    slug: slug(file),
    id: text(metadata, "id"),
    week: text(metadata, "week"),
    summary: text(metadata, "summary"),
    tags: list(metadata, "tags"),
    featured: flag(metadata, "featured"),
  }),
});
