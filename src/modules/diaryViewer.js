export async function renderDiaryEntry(filename, titleSel = "#entry-title", dateSel = "#entry-date", contentSel = "#entry-content", weekSel = ".entry-week") {
    // Security: Validate filename to prevent path traversal
    if (!isValidFilename(filename)) {
        console.error(`Invalid filename: ${filename}`);
        return;
    }

    try {
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
        
        // Security: Use textContent for untrusted data, innerHTML only for processed markdown
        if (titleEl) titleEl.textContent = sanitizeText(metadata.title) || "Untitled";
        if (dateEl) dateEl.textContent = sanitizeText(metadata.date) || "Unknown Date";
        if (weekEl) weekEl.textContent = sanitizeText(metadata.week) || "No Week Info";
        if (contentEl) {
            // Only set innerHTML with processed and sanitized markdown
            contentEl.innerHTML = simpleMarkdownToHtml(convertObsidianLinks(content));
        }

        if (window.Prism) {
            Prism.highlightAll();
        }
    } catch (error) {
        console.error('Error rendering diary entry:', error);
    }
}

// Security: Validate filename to prevent path traversal attacks
function isValidFilename(filename) {
    if (!filename || typeof filename !== 'string') {
        return false;
    }
    
    // Allow only alphanumeric characters, hyphens, underscores, and spaces
    const validPattern = /^[a-zA-Z0-9_\-\s]+$/;
    
    // Prevent path traversal patterns
    const dangerousPatterns = ['./', '../', '..\\', '.\\', ':', '<', '>', '|', '"', '*', '?'];
    
    return validPattern.test(filename) && 
           !dangerousPatterns.some(pattern => filename.includes(pattern)) &&
           filename.length <= 100; // Reasonable length limit
}

// Security: Basic text sanitization
function sanitizeText(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
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
        // Security: Sanitize filename to prevent XSS
        const cleanFilename = sanitizeText(filename.replace(/^pasted image /i, ""));
        // Convert to standard Markdown image syntax
        return `![${cleanFilename}](./media/${encodeURIComponent(cleanFilename)})`;
    });
}

// Security: HTML escape helper function
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

function simpleMarkdownToHtml(md) {
    return md
        // Code Blocks (process before other formatting to avoid conflicts)
        .replace(/```(\w+)?\s*\n([\s\S]*?)```/g, (match, lang, code) => {
            const languageClass = lang ? `language-${escapeHtml(lang)}` : "";
            // Prism requires the language class on the <code> element.
            // The <pre> element gets a class for styling, but not for language detection.
            return `<pre class="line-numbers"><code class="${languageClass}">${escapeHtml(code.trim())}</code></pre>`;
        })

        // Headings - escape content to prevent XSS
        .replace(/^###### (.*$)/gim, (match, content) => `<h6 class="markdown-h6">${escapeHtml(content)}</h6>`)
        .replace(/^##### (.*$)/gim, (match, content) => `<h5 class="markdown-h5">${escapeHtml(content)}</h5>`)
        .replace(/^#### (.*$)/gim, (match, content) => `<h4 class="h2-lower">${escapeHtml(content)}</h4>`)
        .replace(/^### (.*$)/gim, (match, content) => `<h3 class="markdown-h3">${escapeHtml(content)}</h3>`)
        .replace(/^## (.*$)/gim, (match, content) => `<h2 class="h2">${escapeHtml(content)}</h2>`)
        .replace(/^# (.*$)/gim, (match, content) => `<h1 class="markdown-h1">${escapeHtml(content)}</h1>`)

        // Horizontal Rules (standard markdown: ---, ***, ___)
        .replace(/^(---+|\*\*\*+|___+)$/gim, `<div class="line"></div>`)

        // Tags (e.g., #WORKING-ON-IT) - validate tag pattern
        .replace(/#(\w[\w-]*)/g, (match, tag) => {
            if (/^[a-zA-Z0-9_-]+$/.test(tag)) {
                return `<span class="markdown-tag">#${escapeHtml(tag)}</span>`;
            }
            return escapeHtml(match);
        })

        // Images (process before links to avoid conflicts)
        .replace(/!\[(.*?)\]\((.*?)\)/gim, (match, alt, src) => {
            // Security: Validate image sources and escape alt text
            if (isValidImageSrc(src)) {
                return `<img class="markdown-img" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`;
            }
            return escapeHtml(match);
        })
        .replace(/!\[\[(.*?)\]\]/g, (match, filename) => {
            const sanitizedFilename = sanitizeText(filename);
            return `![${sanitizedFilename}](./media/${encodeURIComponent(sanitizedFilename)})`;
        })

        // Links - validate URLs and escape content
        .replace(/<((https?:\/\/)[^>]+)>/gim, (match, url) => {
            if (isValidUrl(url)) {
                return `<a class="markdown-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
            }
            return escapeHtml(match);
        })
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            if (isValidUrl(url) || isValidRelativeUrl(url)) {
                return `<a class="markdown-link-custom" href="${escapeHtml(url)}">${escapeHtml(text)}</a>`;
            }
            return escapeHtml(match);
        })
        .replace(/\[\[(.*?)\]\]/g, (match, filename) => {
            const sanitizedFilename = sanitizeText(filename);
            return `<a class="markdown-link-toc" href="./${encodeURIComponent(sanitizedFilename)}.html">${escapeHtml(sanitizedFilename)}</a>`;
        })

        // Bold and Italic (process ** before * to avoid conflicts) - escape content
        .replace(/\*\*(.*?)\*\*/gim, (match, content) => `<strong class="markdown-strong">${escapeHtml(content)}</strong>`)
        .replace(/\*(.*?)\*/gim, (match, content) => `<em class="markdown-em">${escapeHtml(content)}</em>`)

        // Inline Code - escape content
        .replace(/`([^`]+)`/gim, (match, code) => `<code class="markdown-inline-code">${escapeHtml(code)}</code>`)

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

// Security: URL validation functions
function isValidUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    
    try {
        const urlObj = new URL(url);
        // Only allow http and https protocols
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}

function isValidRelativeUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    
    // Prevent dangerous patterns
    const dangerousPatterns = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
    const lowerUrl = url.toLowerCase();
    
    if (dangerousPatterns.some(pattern => lowerUrl.includes(pattern))) {
        return false;
    }
    
    // Allow relative paths but prevent path traversal
    return !url.includes('..') && !url.startsWith('//');
}

function isValidImageSrc(src) {
    if (!src || typeof src !== 'string') {
        return false;
    }
    
    // Allow relative paths or valid URLs
    if (src.startsWith('./') || src.startsWith('/')) {
        return !src.includes('..') && !src.includes('<') && !src.includes('>');
    }
    
    return isValidUrl(src);
}