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

// Security: Basic text sanitization for display in textContent
// Only escapes < and > to prevent HTML injection
// Used with textContent which already prevents script execution
export function sanitizeText(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    
    // Only escape angle brackets to prevent HTML tags
    // textContent already prevents script execution, so this is just extra safety
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function extractFrontmatter(md) {
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

export function convertObsidianLinks(md) {
    return md.replace(/!\[\[(.*?)\]\]/g, (match, imageFilename) => {
        // Security: Sanitize filename to prevent XSS, but don't over-sanitize
        const cleanFilename = imageFilename.replace(/^pasted image /i, "").trim();
        
        // Convert to standard Markdown image syntax - keep path dynamic
        // The actual path should be specified in the markdown files themselves
        return `![${cleanFilename}](${cleanFilename})`;
    });
}

// Security: HTML escape helper function for use in innerHTML
// Escapes characters that could break HTML or enable XSS
// Note: Single quotes (apostrophes) are NOT escaped as they don't need to be
// in regular HTML content, only in HTML attribute values
export function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function simpleMarkdownToHtml(md) {
    return md
        // Code Blocks (process before other formatting to avoid conflicts)
        .replace(/```(\w+)?\s*\n([\s\S]*?)```/g, (match, lang, code) => {
            const languageClass = lang ? `language-${escapeHtml(lang)}` : "";
            // Prism requires the language class on the <code> element.
            // The <pre> element gets a class for styling, but not for language detection.
            return `<pre class="line-numbers"><code class="${languageClass}">${escapeHtml(code.trim())}</code></pre>`;
        })

        // Headings - process content but don't double-escape
        .replace(/^###### (.*$)/gim, (match, content) => `<h6 class="markdown-h6">${content}</h6>`)
        .replace(/^##### (.*$)/gim, (match, content) => `<h5 class="markdown-h5">${content}</h5>`)
        .replace(/^#### (.*$)/gim, (match, content) => `<h4 class="h2-lower">${content}</h4>`)
        .replace(/^### (.*$)/gim, (match, content) => `<h3 class="markdown-h3">${content}</h3>`)
        .replace(/^## (.*$)/gim, (match, content) => `<h2 class="h2">${content}</h2>`)
        .replace(/^# (.*$)/gim, (match, content) => `<h1 class="markdown-h1">${content}</h1>`)

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
                // Keep paths as specified in markdown - maximum flexibility
                // Just ensure proper leading slash for absolute paths
                let cleanSrc = src;
                if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('./')) {
                    // If it's a relative path without ./ prefix, assume it's relative to diary/entries/
                    cleanSrc = src;
                }
                return `<img class="markdown-img" src="${cleanSrc}" alt="${escapeHtml(alt)}">`;
            }
            return escapeHtml(match);
        })
        .replace(/!\[\[(.*?)\]\]/g, (match, imageFilename) => {
            // Handle Obsidian-style image links - convert to proper paths
            const sanitizedFilename = imageFilename.replace(/^pasted image /i, "").trim();
            // For Obsidian links, assume the path is relative to diary/entries/
            // This allows maximum flexibility for your new structure
            if (isValidImageSrc(sanitizedFilename)) {
                return `<img class="markdown-img" src="${sanitizedFilename}" alt="${escapeHtml(sanitizedFilename)}">`;
            }
            return escapeHtml(match);
        })

        // Links - validate URLs and escape content
        .replace(/<((https?:\/\/)[^>]+)>/gim, (match, url) => {
            if (isValidUrl(url)) {
                return `<a class="markdown-link" href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
            }
            return escapeHtml(match);
        })
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            if (isValidUrl(url) || isValidRelativeUrl(url)) {
                const target = url.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
                return `<a class="markdown-link-custom" href="${url}"${target}>${text}</a>`;
            }
            return escapeHtml(match);
        })
        .replace(/\[\[([^\]]+)\]\]/g, (match, content) => {
            // Handle different wiki-style link formats
            const cleanContent = content.trim();
            
            // Check if it's a URL
            if (cleanContent.startsWith('http://') || cleanContent.startsWith('https://')) {
                if (isValidUrl(cleanContent)) {
                    return `<a class="markdown-link" href="${cleanContent}" target="_blank" rel="noopener noreferrer">${escapeHtml(cleanContent)}</a>`;
                }
                return escapeHtml(match);
            }
            
            // Handle internal diary entries
            if (/^[a-zA-Z0-9._\s-]+$/.test(cleanContent)) {
                const href = `/diary/entries/diary.html?entry=${encodeURIComponent(cleanContent)}`;
                return `<a class="markdown-link-toc" href="${href}">${escapeHtml(cleanContent)}</a>`;
            }
            
            return escapeHtml(match);
        })

        // Bold and Italic (process ** before * to avoid conflicts)
        .replace(/\*\*(.*?)\*\*/gim, (match, content) => `<strong class="markdown-strong">${content}</strong>`)
        .replace(/\*(.*?)\*/gim, (match, content) => `<em class="markdown-em">${content}</em>`)

        // Inline Code - escape content to prevent XSS in code
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

        // Clean up line breaks first
        .replace(/\r\n/g, '\n') // Normalize line endings
        
        // Process lists - simple and straightforward approach
        .replace(/(?:^[\s]*([-*+]|\d+\.)\s+.+$\n?)+/gm, (match) => {
            return '\n\n' + convertSimpleLists(match.trim()) + '\n\n';
        })

        // Handle paragraphs
        .split(/\n\n+/) // Split on one or more double line breaks
        .map(block => {
            block = block.trim();
            if (!block) return '';
            
            // Don't wrap already formatted elements
            if (block.match(/^<(h[1-6]|ul|ol|table|div|pre|blockquote|img)/i)) {
                return block;
            }
            
            // Wrap plain text paragraphs
            return `<p class="markdown-p">${block}</p>`;
        })
        .filter(block => block) // Remove empty blocks
        .join('\n\n')
        .trim();
}

function convertSimpleLists(text) {
    const lines = text.split('\n');
    let result = '';
    let stack = []; // Stack to track open lists: [{type: 'ul', level: 0}, ...]
    
    for (const line of lines) {
        const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
        
        if (match) {
            const indent = match[1];
            const marker = match[2];
            const content = match[3];
            const level = Math.floor(indent.length / 2); // 2 spaces = 1 level
            const isOrdered = /^\d+\./.test(marker);
            const listType = isOrdered ? 'ol' : 'ul';
            
            // Close deeper lists if we're going back to a shallower level
            while (stack.length > 0 && stack[stack.length - 1].level > level) {
                const closing = stack.pop();
                result += `</${closing.type}>`;
            }
            
            // Close and reopen if same level but different type
            if (stack.length > 0 && 
                stack[stack.length - 1].level === level && 
                stack[stack.length - 1].type !== listType) {
                const closing = stack.pop();
                result += `</${closing.type}>`;
            }
            
            // Open new list if needed
            if (stack.length === 0 || stack[stack.length - 1].level < level) {
                result += `<${listType} class="markdown-${listType}">`;
                stack.push({ type: listType, level: level });
            }
            
            // Add list item
            result += `<li class="markdown-li">${content}</li>`;
            
        } else if (line.trim() === '' && stack.length > 0) {
            // Empty line within list - ignore but keep list open
            continue;
        } else {
            // Non-list content - close all open lists
            while (stack.length > 0) {
                const closing = stack.pop();
                result += `</${closing.type}>`;
            }
            if (line.trim()) {
                result += line + '\n';
            }
        }
    }
    
    // Close any remaining open lists
    while (stack.length > 0) {
        const closing = stack.pop();
        result += `</${closing.type}>`;
    }
    
    return result.trim();
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
    
    // Allow relative paths but prevent path traversal, also allow anchors and queries
    // Be more permissive for legitimate diary and site navigation
    return !url.includes('..') && 
           !url.startsWith('//') &&
           !url.includes('<') &&
           !url.includes('>') &&
           (url.startsWith('/') || url.startsWith('./') || url.startsWith('#') || 
            url.includes('?') || /^[a-zA-Z0-9._\s-]+$/.test(url));
}

function isValidImageSrc(src) {
    if (!src || typeof src !== 'string') {
        return false;
    }
    
    // For absolute URLs, use the URL validation
    if (src.includes('://')) {
        return isValidUrl(src);
    }
    
    // For local paths, be permissive but secure
    // Allow any path structure but prevent dangerous patterns
    return !src.includes('..') &&           // Prevent path traversal
           !src.includes('<') &&            // Prevent HTML injection
           !src.includes('>') &&            // Prevent HTML injection  
           !src.includes('"') &&            // Prevent attribute injection
           !src.includes("'") &&            // Prevent attribute injection
           !src.includes('javascript:') &&  // Prevent script injection
           !src.includes('data:') &&        // Prevent data URL injection
           src.length < 500 &&              // Reasonable length limit
           /\.(jpg|jpeg|png|gif|svg|webp|bmp|tiff)$/i.test(src); // Must be image file
}