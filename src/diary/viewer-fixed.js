export async function renderDiaryEntry(filename, titleSel = "#entry-title", dateSel = "#entry-date", contentSel = "#entry-content", weekSel = ".entry-week") {
    const response = await fetch(`/diary/entries/${filename}.md`);
    if (!response.ok) {
        console.error(`Failed to fetch diary entry: ${filename}`);
        return;
    }

    const md = await response.text();
    const metadata = extractFrontmatter(md);
    const content = md.replace(/<!--- metadata\s*\n[\s\S]*?\n\s*--->/, ""); // Remove metadata block

    // Update the DOM with metadata and content
    const titleEl = document.querySelector(titleSel);
    const dateEl = document.querySelector(dateSel);
    const weekEl = document.querySelector(weekSel);
    const contentEl = document.querySelector(contentSel);
    
    if (titleEl) titleEl.textContent = metadata.title || "Untitled";
    if (dateEl) dateEl.textContent = metadata.date || "Unknown Date";
    if (weekEl) weekEl.textContent = metadata.week || "No Week Info";
    if (contentEl) contentEl.innerHTML = simpleMarkdownToHtml(convertObsidianLinks(content));


}

function extractFrontmatter(md) {
    // Try multiple regex patterns to handle different formats
    let fmMatch = md.match(/<!--- metadata\s*\n([\s\S]*?)\n\s*--->/);
    
    if (!fmMatch) {
        // Try without the optional whitespace
        fmMatch = md.match(/<!--- metadata\n([\s\S]*?)\n--->/);
    }
    
    if (!fmMatch) {
        // Try with different comment endings
        fmMatch = md.match(/<!--\s*metadata\s*\n([\s\S]*?)\n\s*-->/);
    }
    
    if (!fmMatch) {
        return {};
    }
    
    const rawContent = fmMatch[1];
    
    // Split lines and process
    const lines = rawContent.split(/\r?\n/);
    const metadata = {};
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.includes(':')) continue;
        
        const colonIndex = trimmedLine.indexOf(':');
        const key = trimmedLine.substring(0, colonIndex).trim();
        const value = trimmedLine.substring(colonIndex + 1).trim();
        
        if (value.startsWith('[') && value.endsWith(']')) {
            try {
                metadata[key] = JSON.parse(value);
            } catch (e) {
                metadata[key] = value;
            }
        } else {
            metadata[key] = value;
        }
    }
    
    return metadata;
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
        // Code Blocks (process before other formatting to avoid conflicts)
        .replace(/```(\w+)?\s*\n([\s\S]*?)```/g, (match, lang, code) => {
            const languageClass = lang ? `language-${lang}` : "";
            return `<pre class="markdown-pre"><code class="markdown-code ${languageClass}">${code.trim()}</code></pre>`;
        })

        // Headings
        .replace(/^###### (.*$)/gim, `<h6 class="markdown-h6">$1</h6>`)
        .replace(/^##### (.*$)/gim, `<h5 class="markdown-h5">$1</h5>`)
        .replace(/^#### (.*$)/gim, `<h4 class="h2-lower">$1</h4>`)
        .replace(/^### (.*$)/gim, `<h3 class="markdown-h3">$1</h3>`)
        .replace(/^## (.*$)/gim, `<h2 class="h2">$1</h2>`)
        .replace(/^# (.*$)/gim, `<h1 class="markdown-h1">$1</h1>`)

        // Horizontal Rules (standard markdown: ---, ***, ___)
        .replace(/^(---+|\*\*\*+|___+)$/gim, `<div class="line"></div>`)

        // Tags (e.g., #WORKING-ON-IT)
        .replace(/#(\w[\w-]*)/g, `<span class="markdown-tag">#$1</span>`)

        // Images (process before links to avoid conflicts)
        .replace(/!\[(.*?)\]\((.*?)\)/gim, `<img class="markdown-img" src="$2" alt="$1">`)
        .replace(/!\[\[(.*?)\]\]/g, (match, filename) => {
            return `![${filename}](./media/${filename})`;
        })

        // Links
        .replace(/<((https?:\/\/)[^>]+)>/gim, `<a class="markdown-link" href="$1" target="_blank">$1</a>`)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a class="markdown-link-custom" href="$2">$1</a>`)
        .replace(/\[\[(.*?)\]\]/g, (match, filename) => {
            return `<a class="markdown-link-toc" href="./${filename}.html">${filename}</a>`;
        })

        // Bold and Italic (process ** before * to avoid conflicts)
        .replace(/\*\*(.*?)\*\*/gim, `<strong class="markdown-strong">$1</strong>`)
        .replace(/\*(.*?)\*/gim, `<em class="markdown-em">$1</em>`)

        // Inline Code
        .replace(/`([^`]+)`/gim, `<code class="markdown-inline-code">$1</code>`)

        // Tables
        .replace(/^\|(.+)\|[\r\n]+\|([-:\s|]+)\|[\r\n]+((?:\|.*\|[\r\n]*)*)/gm, (match) => {
            const lines = match.trim().split(/[\r\n]+/);
            if (lines.length < 3) return match;
            
            // Parse header row
            const headerCells = lines[0]
                .split('|')
                .filter(cell => cell.trim() !== '')
                .map(cell => `<th class="markdown-th">${cell.trim()}</th>`)
                .join('');
            
            // Parse body rows (skip the separator line)
            const bodyRows = lines
                .slice(2)
                .filter(line => line.trim() && line.includes('|'))
                .map(row => {
                    const cells = row
                        .split('|')
                        .filter(cell => cell.trim() !== '')
                        .map(cell => `<td class="markdown-td">${cell.trim()}</td>`)
                        .join('');
                    return `<tr class="markdown-tr">${cells}</tr>`;
                })
                .join('');
            
            return `<div class="markdown-table-wrapper"><table class="markdown-table"><thead><tr class="markdown-tr">${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
        })

        // Lists - improved approach with better nesting support
        .replace(/^(\s*)([-*+]|\d+\.)\s+(.*)$/gm, (match, indent, marker, content) => {
            const level = Math.floor(indent.length / 2); // Support 2-space indentation
            const isOrdered = /^\d+\./.test(marker);
            const listType = isOrdered ? 'ol' : 'ul';
            return `<li class="markdown-li" data-level="${level}" data-list-type="${listType}">${content}</li>`;
        })

        // Convert adjacent list items into proper lists
        .replace(/(<li class="markdown-li[^"]*"[^>]*>.*?<\/li>\s*)+/gs, (match) => {
            return convertToNestedLists(match);
        })

        // Clean up line breaks and handle paragraphs
        .replace(/\r\n/g, '\n') // Normalize line endings
        .split('\n\n') // Split on double line breaks
        .map(paragraph => {
            paragraph = paragraph.trim();
            if (!paragraph) return '';
            
            // Don't wrap already formatted elements
            if (paragraph.match(/^<(h[1-6]|ul|ol|li|table|div|pre|blockquote|hr)/i)) {
                return paragraph;
            }
            
            // Wrap plain text paragraphs
            return `<p class="markdown-p">${paragraph}</p>`;
        })
        .join('\n')
        .trim();
}

function convertToNestedLists(listItemsHtml) {
    // Parse list items
    const items = [];
    const itemRegex = /<li class="markdown-li" data-level="(\d+)" data-list-type="(ul|ol)"[^>]*>(.*?)<\/li>/gs;
    let match;
    
    while ((match = itemRegex.exec(listItemsHtml)) !== null) {
        items.push({
            level: parseInt(match[1]),
            type: match[2],
            content: match[3]
        });
    }
    
    if (items.length === 0) return listItemsHtml;
    
    // Build nested structure
    let result = '';
    let openTags = [];
    let currentLevel = -1;
    
    for (const item of items) {
        // Close lists if going to lower level
        while (currentLevel >= item.level && openTags.length > 0) {
            const tag = openTags.pop();
            result += `</${tag}>`;
            currentLevel--;
        }
        
        // Open lists if going to higher level
        while (currentLevel < item.level) {
            const className = `markdown-${item.type}`;
            result += `<${item.type} class="${className}">`;
            openTags.push(item.type);
            currentLevel++;
        }
        
        // Add list item
        result += `<li class="markdown-li">${item.content}</li>`;
    }
    
    // Close remaining open tags
    while (openTags.length > 0) {
        const tag = openTags.pop();
        result += `</${tag}>`;
    }
    
    return result;
}
