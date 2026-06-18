type RenderMarkdownOptions = {
  assetBasePath?: string;
};

type CodeBlock = {
  lang: string;
  code: string;
};

type ListStackItem = {
  type: "ol" | "ul";
  level: number;
};

const ALLOWED_HTML_TAGS = new Set([
  "a",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
]);

const GLOBAL_HTML_ATTRIBUTES = new Set(["class", "id"]);
const TAG_ATTRIBUTE_ALLOWLIST: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
  img: new Set(["alt", "src"]),
  ol: new Set(["start"]),
};

export type TableOfContentsItem = {
  id: string;
  level: number;
  text: string;
};

export function renderMarkdown(
  content: string,
  options: RenderMarkdownOptions = {},
): string {
  const normalized = normalizeRelativeImages(content, options.assetBasePath);
  return sanitizeRenderedHtml(addHeadingIds(simpleMarkdownToHtml(normalized)));
}

export function extractTableOfContents(
  content: string,
  options: RenderMarkdownOptions = {},
): TableOfContentsItem[] {
  const html = renderMarkdown(content, options);
  const items: TableOfContentsItem[] = [];
  const headingPattern = /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = headingPattern.exec(html)) !== null) {
    const level = Number(match[1]);
    if (level !== 2 && level !== 3) continue;
    const id = match[2].match(/\sid="([^"]+)"/)?.[1];
    const text = stripHtml(match[3]).trim();
    if (!id || !text) continue;
    items.push({ id, level, text: shortenTocLabel(text) });
  }

  return items;
}

function addHeadingIds(html: string): string {
  const counts = new Map<string, number>();
  return html.replace(
    /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_match, level, attributes, body) => {
      const id = createUniqueHeadingId(stripHtml(body), counts);
      return `<h${level}${attributes} id="${id}">${body}</h${level}>`;
    },
  );
}

function normalizeRelativeImages(content: string, assetBasePath?: string): string {
  if (!assetBasePath) return content;
  return content.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/|\/)([^)]+)\)/g,
    (_match, alt, src) => {
      const base = assetBasePath.endsWith("/") ? assetBasePath : `${assetBasePath}/`;
      return `![${alt}](${base}${String(src).replace(/^\.\/+/, "")})`;
    },
  );
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, `"`);
}

function shortenTocLabel(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 72 ? `${compact.slice(0, 69).trimEnd()}…` : compact;
}

function createUniqueHeadingId(text: string, counts: Map<string, number>): string {
  const base =
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 50) || "section";
  const count = counts.get(base) || 0;
  counts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function simpleMarkdownToHtml(md: string): string {
  const codeBlockStore: CodeBlock[] = [];
  let markdown = md.replace(
    /^([ \t]*)```(\w+)?[^\n]*\n([\s\S]*?)^[ \t]*```\s*$/gim,
    (_whole, indent = "", lang = "", code = "") => {
      const lines = String(code).split("\n");
      const normalized = lines
        .map((line) => {
          if (indent && line.startsWith(indent)) return line.slice(indent.length);
          return line;
        })
        .join("\n");
      const cleaned = normalized.replace(/\n+$/g, "");
      const idx = codeBlockStore.push({ lang, code: cleaned }) - 1;
      return `${indent}<pre data-codeblock="${idx}"></pre>`;
    },
  );

  return markdown
    .replace(/^###### (.*$)/gim, (_match, content) => `<h6 class="markdown-h6">${content}</h6>`)
    .replace(/^##### (.*$)/gim, (_match, content) => `<h5 class="markdown-h5">${content}</h5>`)
    .replace(/^#### (.*$)/gim, (_match, content) => `<h4 class="h2-lower">${content}</h4>`)
    .replace(/^### (.*$)/gim, (_match, content) => `<h3 class="markdown-h3">${content}</h3>`)
    .replace(/^## (.*$)/gim, (_match, content) => `<h2 class="h2">${content}</h2>`)
    .replace(/^# (.*$)/gim, (_match, content) => `<h1 class="markdown-h1">${content}</h1>`)
    .replace(/^(---+|\*\*\*+|___+)$/gim, `<div class="line"></div>`)
    .replace(/#(\w[\w-]*)/g, (match, tag) => {
      if (/^[a-zA-Z0-9_-]+$/.test(tag)) {
        return `<span class="markdown-tag">#${escapeHtml(tag)}</span>`;
      }
      return escapeHtml(match);
    })
    .replace(/!\[(.*?)\]\((.*?)\)/gim, (match, alt, src) => {
      if (isValidImageSrc(src)) {
        return `<img class="markdown-img" src="${resolveMarkdownAssetPath(src)}" alt="${escapeHtml(alt)}">`;
      }
      return escapeHtml(match);
    })
    .replace(/!\[\[(.*?)\]\]/g, (match, imageFilename) => {
      const sanitizedFilename = imageFilename.replace(/^pasted image /i, "").trim();
      if (isValidImageSrc(sanitizedFilename)) {
        return `<img class="markdown-img" src="${resolveMarkdownAssetPath(sanitizedFilename)}" alt="${escapeHtml(sanitizedFilename)}">`;
      }
      return escapeHtml(match);
    })
    .replace(/<((https?:\/\/)[^>]+)>/gim, (match, url) => {
      if (isValidUrl(url)) {
        return `<a class="markdown-link" href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
      }
      return escapeHtml(match);
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      if (isValidUrl(url) || isValidRelativeUrl(url)) {
        const target =
          url.startsWith("http") ? ` target="_blank" rel="noopener noreferrer"` : "";
        return `<a class="markdown-link-custom" href="${url}"${target}>${text}</a>`;
      }
      return escapeHtml(match);
    })
    .replace(/\[\[([^\]]+)\]\]/g, (match, content) => {
      const cleanContent = content.trim();

      if (cleanContent.startsWith("http://") || cleanContent.startsWith("https://")) {
        if (isValidUrl(cleanContent)) {
          return `<a class="markdown-link" href="${cleanContent}" target="_blank" rel="noopener noreferrer">${escapeHtml(cleanContent)}</a>`;
        }
        return escapeHtml(match);
      }

      if (/^[a-zA-Z0-9._\s-]+$/.test(cleanContent)) {
        const href = `/writing/entry.html?entry=${encodeURIComponent(cleanContent)}`;
        return `<a class="markdown-link-toc" href="${href}">${escapeHtml(cleanContent)}</a>`;
      }

      return escapeHtml(match);
    })
    .replace(/\*\*(.*?)\*\*/gim, (_match, content) => `<strong class="markdown-strong">${content}</strong>`)
    .replace(/\*(.*?)\*/gim, (_match, content) => `<em class="markdown-em">${content}</em>`)
    .replace(/`([^`]+)`/gim, (_match, code) => `<code class="markdown-inline-code">${escapeHtml(code)}</code>`)
    .replace(
      /^\|(.+)\|[\r\n]+\|([-:\s|]+)\|[\r\n]+((?:\|.*\|[\r\n]*)*)/gm,
      (match) => {
        const lines = match.trim().split(/[\r\n]+/);
        if (lines.length < 3) return match;

        const headerCells = lines[0]
          .split("|")
          .filter((cell) => cell.trim() !== "")
          .map((cell) => `<th class="markdown-th">${cell.trim()}</th>`)
          .join("");

        const bodyRows = lines
          .slice(2)
          .filter((line) => line.trim() && line.includes("|"))
          .map((row) => {
            const cells = row
              .split("|")
              .filter((cell) => cell.trim() !== "")
              .map((cell) => `<td class="markdown-td">${cell.trim()}</td>`)
              .join("");
            return `<tr class="markdown-tr">${cells}</tr>`;
          })
          .join("");

        return `<div class="markdown-table-wrapper"><table class="markdown-table"><thead><tr class="markdown-tr">${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
      },
    )
    .replace(/\r\n/g, "\n")
    .replace(/(?:^[ \t]*(?:[-*+]|\d+\.)\s+.*(?:\r?\n(?:[ \t]*\r?\n)?[ \t]+.*)*)+/gm, (match) => {
      return `\n\n${convertSimpleLists(match.trim())}\n\n`;
    })
    .split(/\n\n+/)
    .map((block) => wrapParagraphBlock(block))
    .filter(Boolean)
    .join("\n\n")
    .replace(/(^[ \t]*)?<pre data-codeblock="(\d+)"><\/pre>/gm, (match, maybeIndent, idx) => {
      const index = Number(idx);
      const indent = maybeIndent || "";
      if (!Number.isFinite(index) || !codeBlockStore[index]) return match;
      const { lang, code } = codeBlockStore[index];
      const languageClass = lang ? `language-${escapeHtml(lang)}` : "";
      return `${indent}<pre class="line-numbers"><code class="${languageClass}">${escapeHtml(code.trim())}</code></pre>`;
    })
    .trim();
}

function wrapParagraphBlock(block: string): string {
  const trimmed = block.trim();
  if (!trimmed) return "";

  const standaloneMatch = trimmed.match(
    /^(<(?:h[1-6]|pre|div|img)\b[^>]*>(?:[\s\S]*?<\/(?:h[1-6]|pre|div)>|))\n+([\s\S]+)$/i,
  );
  if (standaloneMatch) {
    const [, standalone, rest] = standaloneMatch;
    return `${standalone}\n\n${wrapParagraphBlock(rest)}`;
  }

  if (trimmed.match(/^<(h[1-6]|ul|ol|table|div|pre|blockquote|img)/i)) {
    return trimmed;
  }

  return `<p class="markdown-p">${trimmed}</p>`;
}

function convertSimpleLists(text: string): string {
  const lines = text.split("\n");
  let result = "";
  const stack: ListStackItem[] = [];
  let lastLiOpenAtLevel: number | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);

    if (match) {
      const indent = match[1];
      const marker = match[2];
      const content = match[3];
      const level = Math.floor(indent.length / 2);
      const isOrdered = /^\d+\./.test(marker);
      const listType: "ol" | "ul" = isOrdered ? "ol" : "ul";

      while (stack.length > 0 && stack[stack.length - 1].level > level) {
        if (lastLiOpenAtLevel === stack[stack.length - 1].level) {
          result += `</li>`;
          lastLiOpenAtLevel = null;
        }
        const closing = stack.pop();
        if (closing) result += `</${closing.type}>`;
      }

      if (
        stack.length > 0 &&
        stack[stack.length - 1].level === level &&
        stack[stack.length - 1].type !== listType
      ) {
        if (lastLiOpenAtLevel === level) {
          result += `</li>`;
          lastLiOpenAtLevel = null;
        }
        const closing = stack.pop();
        if (closing) result += `</${closing.type}>`;
      }

      if (stack.length === 0 || stack[stack.length - 1].level < level) {
        let startAttr = "";
        if (listType === "ol") {
          const startMatch = marker.match(/^(\d+)\./);
          if (startMatch) {
            const n = parseInt(startMatch[1], 10);
            if (!Number.isNaN(n) && n !== 1) startAttr = ` start="${n}"`;
          }
        }

        result += `<${listType} class="markdown-${listType}"${startAttr}>`;
        stack.push({ type: listType, level });
      }

      if (lastLiOpenAtLevel === level) {
        result += `</li>`;
      }

      result += `<li class="markdown-li">${content}`;
      lastLiOpenAtLevel = level;
    } else if (line.trim() === "" && stack.length > 0) {
      if (lastLiOpenAtLevel !== null) {
        const nextNonEmptyLine = (() => {
          for (let k = i + 1; k < lines.length; k += 1) {
            if (lines[k].trim() !== "") return k;
          }
          return -1;
        })();

        if (nextNonEmptyLine === -1 || !/^[ \t]*<pre data-codeblock=/.test(lines[nextNonEmptyLine])) {
          result += "\n";
        }
      }
      continue;
    } else {
      const indentMatch = line.match(/^(\s*)/);
      const indentLen = indentMatch ? indentMatch[1].length : 0;
      const currentLevel = stack.length ? stack[stack.length - 1].level : -1;

      if (stack.length > 0 && lastLiOpenAtLevel !== null && indentLen > currentLevel * 2) {
        if (/^[ \t]*<pre data-codeblock=/.test(line)) {
          result += `\n${line.replace(/^[ \t]+/, "").replace(/\s+$/, "")}`;
        } else {
          result += `\n${line.replace(/\s+$/, "")}`;
        }
      } else {
        if (lastLiOpenAtLevel !== null) {
          result += `</li>`;
          lastLiOpenAtLevel = null;
        }

        while (stack.length > 0) {
          const closing = stack.pop();
          if (closing) result += `</${closing.type}>`;
        }

        if (line.trim()) {
          result += `${line}\n`;
        }
      }
    }
  }

  if (lastLiOpenAtLevel !== null) {
    result += `</li>`;
  }

  while (stack.length > 0) {
    const closing = stack.pop();
    if (closing) result += `</${closing.type}>`;
  }

  return result.trim();
}

function isValidUrl(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidRelativeUrl(url: string): boolean {
  if (!url) return false;

  const dangerousPatterns = ["javascript:", "data:", "vbscript:", "file:", "ftp:"];
  const lowerUrl = url.toLowerCase();

  if (dangerousPatterns.some((pattern) => lowerUrl.includes(pattern))) {
    return false;
  }

  return (
    !url.includes("..") &&
    !url.startsWith("//") &&
    !url.includes("<") &&
    !url.includes(">") &&
    (url.startsWith("/") ||
      url.startsWith("./") ||
      url.startsWith("#") ||
      url.includes("?") ||
      /^[a-zA-Z0-9._\s-]+$/.test(url))
  );
}

function isValidImageSrc(src: string): boolean {
  if (!src) return false;

  if (src.includes("://")) {
    return isValidUrl(src);
  }

  return (
    !src.includes("..") &&
    !src.includes("<") &&
    !src.includes(">") &&
    !src.includes('"') &&
    !src.includes("'") &&
    !src.includes("javascript:") &&
    !src.includes("data:") &&
    src.length < 500 &&
    /\.(jpg|jpeg|png|gif|svg|webp|bmp|tiff)$/i.test(src)
  );
}

function resolveMarkdownAssetPath(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) {
    return src;
  }

  const cleaned = src.replace(/^\.\/+/, "").replace(/^\/+/, "");
  return `/${cleaned}`;
}

function sanitizeRenderedHtml(html: string): string {
  if (typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;
  sanitizeElementChildren(template.content);
  return template.innerHTML;
}

function sanitizeElementChildren(root: ParentNode): void {
  Array.from(root.childNodes).forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    sanitizeElement(node as Element);
  });
}

function sanitizeElement(element: Element): void {
  const tag = element.tagName.toLowerCase();

  if (!ALLOWED_HTML_TAGS.has(tag)) {
    element.replaceWith(document.createTextNode(element.textContent || ""));
    return;
  }

  Array.from(element.attributes).forEach((attribute) => {
    if (!isAllowedAttribute(tag, attribute.name)) {
      element.removeAttribute(attribute.name);
      return;
    }

    const normalizedName = attribute.name.toLowerCase();
    const value = attribute.value;

    if (normalizedName === "class" && !/^[\w -]+$/.test(value)) {
      element.removeAttribute(attribute.name);
      return;
    }

    if (normalizedName === "id" && !/^[A-Za-z0-9_-]+$/.test(value)) {
      element.removeAttribute(attribute.name);
      return;
    }

    if (tag === "a" && normalizedName === "href") {
      if (isValidUrl(value) || isValidRelativeUrl(value)) {
        if (element.getAttribute("target") === "_blank") {
          element.setAttribute("rel", "noopener noreferrer");
        }
      } else {
        element.replaceWith(document.createTextNode(element.textContent || ""));
        return;
      }
    }

    if (tag === "img" && normalizedName === "src") {
      if (!isValidImageSrc(value)) {
        element.remove();
        return;
      }
      element.setAttribute("src", resolveMarkdownAssetPath(value));
    }

    if (tag === "ol" && normalizedName === "start" && !/^\d+$/.test(value)) {
      element.removeAttribute(attribute.name);
    }
  });

  sanitizeElementChildren(element);
}

function isAllowedAttribute(tag: string, attributeName: string): boolean {
  const normalizedName = attributeName.toLowerCase();
  return (
    GLOBAL_HTML_ATTRIBUTES.has(normalizedName) ||
    TAG_ATTRIBUTE_ALLOWLIST[tag]?.has(normalizedName) === true
  );
}
