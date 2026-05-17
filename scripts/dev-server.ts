import { existsSync, statSync } from "node:fs";

const root = process.cwd();
const port = Number(Bun.env.PORT || 3000);

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8"
};

function resolveFilePath(urlPath: string) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleanPath = decoded === "/" ? "/index.html" : decoded;
  const directPath = `${root}${cleanPath}`;

  if (existsSync(directPath) && statSync(directPath).isFile()) {
    return directPath;
  }

  if (!cleanPath.endsWith(".html")) {
    const htmlPath = `${root}${cleanPath.replace(/\/$/, "")}/index.html`;
    if (existsSync(htmlPath)) {
      return htmlPath;
    }
  }

  return `${root}/404.html`;
}

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const filePath = resolveFilePath(url.pathname);
    const file = Bun.file(filePath);
    const ext = filePath.slice(filePath.lastIndexOf("."));
    const headers = new Headers();
    headers.set("content-type", mimeTypes[ext] || "application/octet-stream");
    return new Response(await file.arrayBuffer(), { headers, status: filePath.endsWith("404.html") ? 404 : 200 });
  }
});

console.log(`Serving ${root} at http://localhost:${port}`);
