export async function renderDiaryEntry(filename, titleSel = "#entry-title", dateSel = "#entry-date", contentSel = "#entry-content") {
    const response = await fetch(`/diary/entries/${filename}.md`);
    if (!response.ok) {
        console.error(`Failed to fetch diary entry: ${filename}`);
        return;
    }

    const md = await response.text();
    const metadata = extractFrontmatter(md);
    const content = md.replace(/<!--- metadata\n[\s\S]+?--->/, ""); // Remove metadata block

    // Update the DOM with metadata and content
    document.querySelector(titleSel).textContent = metadata.title || "Untitled";
    document.querySelector(dateSel).textContent = metadata.date || "Unknown Date";
    document.querySelector(contentSel).innerHTML = simpleMarkdownToHtml(convertObsidianLinks(content));
}

function extractFrontmatter(md) {
    const fmMatch = md.match(/<!--- metadata\n([\s\S]+?)--->/);
    if (!fmMatch) return {};
    return fmMatch[1]
        .split("\n")
        .filter(line => line.includes(":")) // Ignore empty or invalid lines
        .reduce((acc, line) => {
            const [key, ...valueParts] = line.split(":");
            acc[key.trim()] = valueParts.join(":").trim(); // Handle values with colons
            return acc;
        }, {});
}

function convertObsidianLinks(md) {
    return md.replace(/!\[\[(.*?)\]\]/g, (match, filename) => {
        // Remove "pasted image" prefix if it exists
        const cleanFilename = filename.replace(/^pasted image /i, "");
        // Convert to standard Markdown image syntax
        return `![${cleanFilename}](./media/${cleanFilename})`;
    });
}

function simpleMarkdownToHtml(md) {
    return md
        // Headings
        .replace(/^###### (.*$)/gim, `<h6 class="markdown-h6">$1</h6>`)
        .replace(/^##### (.*$)/gim, `<h5 class="markdown-h5">$1</h5>`)
        .replace(/^#### (.*$)/gim, `<h4 class="markdown-h4">$1</h4>`)
        .replace(/^### (.*$)/gim, `<h3 class="markdown-h3">$1</h3>`)
        .replace(/^## (.*$)/gim, `<h2 class="markdown-h2">$1</h2>`)
        .replace(/^# (.*$)/gim, `<h1 class="markdown-h1">$1</h1>`)

        // Horizontal Rule
        .replace(/___/gim, `<div class="line"></div>`)

        // Tags (e.g., #WORKING-ON-IT)
        .replace(/#(\w[\w-]*)/g, `<span class="markdown-tag">#$1</span>`)

        // Images
        .replace(/!\[(.*?)\]\((.*?)\)/gim, `<img class="markdown-img" src="$2" alt="$1">`)
        .replace(/!\[\[(.*?)\]\]/g, (match, filename) => {
            return `![${filename}](./media/${filename})`;
        })

        // Links
        .replace(/<((https?:\/\/)[^>]+)>/gim, `<a class="markdown-link" href="$1" target="_blank">$1</a>`)
        .replace(/\[\[(.*?)\]\]/g, (match, filename) => {
            return `<a href="./${filename}.html">${filename}</a>`;
        })

        // Bold and Italic
        .replace(/\*\*(.*?)\*\*/gim, `<strong class="markdown-strong">$1</strong>`)
        .replace(/\*(.*?)\*/gim, `<em class="markdown-em">$1</em>`)

        // Code Blocks
        .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const languageClass = lang ? `language-${lang}` : "";
            return `<pre class="markdown-pre"><code class="markdown-code ${languageClass}">${code.trim()}</code></pre>`;
        })

        // Inline Code
        .replace(/`([^`]+)`/gim, `<code class="markdown-inline-code">$1</code>`)

        // Tables
        .replace(/^\|(.+)\|\n\|([-| ]+)\|\n((\|.*\|\n)*)/gim, match => {
            const rows = match.trim().split("\n");
            const header = rows[0]
                .split("|")
                .filter(cell => cell.trim() !== "") // Remove empty cells
                .map(cell => `<th>${cell.trim()}</th>`)
                .join("");
            const body = rows
                .slice(2)
                .map(row =>
                    `<tr>${row
                        .split("|")
                        .filter(cell => cell.trim() !== "") // Remove empty cells
                        .map(cell => `<td>${cell.trim()}</td>`)
                        .join("")}</tr>`
                )
                .join("");
            return `<div class="markdown-table-wrapper"><table class="markdown-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;
        })

        // Nested Lists
        .replace(/^((?: {2})+)- (.*)$/gm, (match, spaces, content) => {
            const level = spaces.length / 2; // Determine nesting level
            return `<li class="markdown-li level-${level}">${content}</li>`;
        })
        .replace(/(<li class="markdown-li level-(\d+)">.*<\/li>)/gim, (match, listItem, level) => {
            const ulStart = `<ul class="markdown-ul level-${level}">`;
            const ulEnd = `</ul>`;
            return `${ulStart}${listItem}${ulEnd}`;
        })

        // Top-Level Lists
        .replace(/^- (.*$)/gim, `<li class="markdown-li level-0">$1</li>`)
        .replace(/(<li class="markdown-li level-0">.*<\/li>)/gim, `<ul class="markdown-ul level-0">$1</ul>`)

        // Paragraphs
        .replace(/\n{2,}/g, `</p><p class="markdown-p">`)
        .replace(/^(.+)$/gm, `<p class="markdown-p">$1</p>`)
        .trim();
}