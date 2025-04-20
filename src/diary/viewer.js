export async function renderDiaryEntry(filename, titleSel = "#entry-title", dateSel = "#entry-date", contentSel = "#entry-content") {
    const titleEl = document.querySelector(titleSel);
    const dateEl = document.querySelector(dateSel);
    const contentEl = document.querySelector(contentSel);

    try {
        const res = await fetch(`./${filename}.md`);
        if (!res.ok) throw new Error("Entry not found.");
        const md = await res.text();

        const frontmatter = extractFrontmatter(md);
        const markdownContent = md.replace(/^---[\s\S]+?---/, "").trim();

        // Convert Obsidian-style links to standard Markdown
        const convertedMarkdown = convertObsidianLinks(markdownContent);

        titleEl.textContent = frontmatter.title || filename;
        dateEl.textContent = frontmatter.date || "";
        contentEl.innerHTML = simpleMarkdownToHtml(convertedMarkdown);
    } catch (err) {
        titleEl.textContent = "Error loading entry";
        contentEl.innerHTML = `<p>${err.message}</p>`;
    }
}

function extractFrontmatter(md) {
    const fmMatch = md.match(/^---\n([\s\S]+?)\n---/);
    if (!fmMatch) return {};
    return Object.fromEntries(
        fmMatch[1]
            .split("\n")
            .map(line => line.split(":").map(part => part.trim()))
    );
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