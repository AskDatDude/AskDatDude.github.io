import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

const sourceRoots = ["index.html", "404.html", "src", "public", "tools"];
const sourceExtensions = /\.(css|html|json|md|ts|tsx)$/;
const sourceFiles: string[] = [];
const missingReferences = new Set<string>();

function collectSourceFiles(path: string) {
  const stats = statSync(path);

  if (stats.isDirectory()) {
    for (const name of readdirSync(path)) {
      collectSourceFiles(join(path, name));
    }
    return;
  }

  if (sourceExtensions.test(path)) {
    sourceFiles.push(path);
  }
}

function checkAsset(file: string, url: string, basePath = "public") {
  const decodedUrl = decodeURIComponent(url);
  const assetPath = join(basePath, decodedUrl);

  if (!existsSync(assetPath)) {
    missingReferences.add(`${file}: ${url}`);
  }
}

for (const root of sourceRoots) {
  if (!existsSync(root)) continue;
  collectSourceFiles(root);
}

for (const file of sourceFiles) {
  const content = readFileSync(file, "utf8");

  for (const match of content.matchAll(/\/assets\/[^"'\s)<]+/g)) {
    checkAsset(file, match[0]);
  }

  if (file.startsWith("public/writing/entries/") && file.endsWith(".md")) {
    for (const match of content.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)) {
      checkAsset(file, match[1], "public/writing/entries");
    }
  }
}

if (missingReferences.size > 0) {
  console.error([...missingReferences].join("\n"));
  process.exit(1);
}

console.log(
  `Checked ${sourceFiles.length} source files; all local asset references resolve.`,
);
