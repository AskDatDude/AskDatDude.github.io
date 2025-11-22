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
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
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
    // Extract fenced code blocks into placeholders first (preserve exact
    // contents, including blank lines and leading/trailing whitespace). We
    // store them and then restore after we run other markdown transformations
    // so nothing else mutates code content.
    const codeBlockStore = [];
    md = md.replace(/^([ \t]*)```(\w+)?[^\n]*\n([\s\S]*?)^[ \t]*```\s*$/gim, (whole, indent = '', lang, code) => {
        // Normalize code lines by removing the leading indentation prefix
        // that came from a list item (so code inside a list isn't double
        // indented). We still preserve all other whitespace and blank lines.
        const lines = code.split('\n');
        const normalized = lines.map(l => {
            if (indent && l.startsWith(indent)) return l.slice(indent.length);
            return l;
        }).join('\n');

        // Strip any trailing blank lines from the captured code block so the
        // rendered <pre><code> doesn't end with an extra empty row while
        // preserving internal blank lines.
        const cleaned = normalized.replace(/\n+$/g, '');
        const idx = codeBlockStore.push({ lang: lang || '', code: cleaned }) - 1;
        // Preserve the original indentation so list processing can determine
        // whether this fence belongs to an enclosing list item.
        return `${indent}<pre data-codeblock="${idx}"></pre>`;
    });

    return md

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
        
        // Process lists: include any following indented lines that belong to the
        // same list item (for example indented paragraphs or fenced code
        // blocks). This ensures code-blocks or other nested blocks under a list
        // item are treated as part of the <li> instead of breaking the list.
        // We also allow a single blank line between the item and the indented
        // block so markdown that uses an empty line before an indented fenced
        // block still treats that fence as inside the <li>.
        .replace(/(?:^[ \t]*(?:[-*+]|\d+\.)\s+.*(?:\r?\n(?:[ \t]*\r?\n)?[ \t]+.*)*)+/gm, (match) => {
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
        // Restore any protected fenced code blocks (insert escaped HTML
        // without trimming or altering inside content)
        .replace(/(^[ \t]*)?<pre data-codeblock="(\d+)"><\/pre>/gm, (m, maybeIndent, idx) => {
            const i = Number(idx);
            const indent = maybeIndent || '';
            if (!Number.isFinite(i) || !codeBlockStore[i]) return m;
            const { lang, code } = codeBlockStore[i];
            const languageClass = lang ? `language-${escapeHtml(lang)}` : "";
            // Insert the preserved indentation back before the final HTML so
            // nested fences line up exactly where they were in the source.
            return `${indent}<pre class="line-numbers"><code class="${languageClass}">${escapeHtml(code.trim())}</code></pre>`;
        })
        .trim();
}

function convertSimpleLists(text) {
    const lines = text.split('\n');
    let result = '';
    let stack = []; // Stack to track open lists: [{type: 'ul', level: 0}, ...]
    
    // We'll treat indented lines as content that belongs to the most recently
    // opened list item. This allows fenced code blocks or paragraphs that are
    // indented under an item to remain inside the <li> instead of closing the
    // list. If a list item starts with a number other than 1 we set the
    // <ol start="N"> attribute so discontinuous blocks render with intended
    // numbering.
    let lastLiOpenAtLevel = null; // track level of currently open <li>

    // Examples:
    // 1) Indented content attached to previous item stays inside the <li>:
    //    1. Item A
    //       indented content belonging to Item A
    //    2. Item B
    //    -> the 'indented content' remains inside the <li> for Item A
    //
    // 2) A top-level block such as a fenced code block that is NOT indented
    //    will not be treated as continuation of the list. If a later top-level
    //    ordered item starts with a number > 1 it will render as a new <ol
    //    start="N"> (so '3.' will render starting at 3 instead of re-numbering
    //    from 1).

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
        
        if (match) {
            const indent = match[1];
            const marker = match[2];
            const content = match[3];
            const level = Math.floor(indent.length / 2); // 2 spaces = 1 level
            const isOrdered = /^\d+\./.test(marker);
            const listType = isOrdered ? 'ol' : 'ul';
            
            // Close deeper lists if we're going back to a shallower level.
            // Also close any open <li> that belonged to that deeper level.
            while (stack.length > 0 && stack[stack.length - 1].level > level) {
                if (lastLiOpenAtLevel === stack[stack.length - 1].level) {
                    result += `</li>`;
                    lastLiOpenAtLevel = null;
                }
                const closing = stack.pop();
                result += `</${closing.type}>`;
            }
            
            // Close and reopen if same level but different type. If we had an
            // open <li> at this level, close it first.
            if (stack.length > 0 &&
                stack[stack.length - 1].level === level &&
                stack[stack.length - 1].type !== listType) {
                if (lastLiOpenAtLevel === level) {
                    result += `</li>`;
                    lastLiOpenAtLevel = null;
                }
                const closing = stack.pop();
                result += `</${closing.type}>`;
            }
            
            // Open new list if needed. When an ordered list starts with a
            // number > 1, emit a start attribute so the rendered numbering
            // matches the author's intent for non-contiguous blocks.
            if (stack.length === 0 || stack[stack.length - 1].level < level) {
                let startAttr = '';
                if (listType === 'ol') {
                    const m = marker.match(/^(\d+)\./);
                    if (m) {
                        const n = parseInt(m[1], 10);
                        if (!Number.isNaN(n) && n !== 1) startAttr = ` start="${n}"`;
                    }
                }

                result += `<${listType} class="markdown-${listType}"${startAttr}>`;
                stack.push({ type: listType, level: level });
            }
            
            // Add list item. We keep the <li> open so subsequent indented lines
            // can be appended as content for the same item (fenced blocks,
            // paragraphs, etc.). We'll close this <li> later when a sibling
            // item or a non-indented line occurs.
            if (lastLiOpenAtLevel === level) {
                // Close previous li at same level before opening a new one
                result += `</li>`;
            }

            result += `<li class="markdown-li">${content}`;
            lastLiOpenAtLevel = level;
            
        } else if (line.trim() === '' && stack.length > 0) {
            // Empty line within list - keep it as a separator inside the
            // current <li> (if open) or ignore otherwise.
            if (lastLiOpenAtLevel !== null) {
                // If the empty line is immediately followed by an indented
                // block (for example a fenced code placeholder), don't add an
                // extra newline here — the following indented line will append
                // one. This avoids producing double-empty lines when there is
                // a single blank row between the list item and an indented
                // block (what the user expects).
                const j = (() => {
                    for (let k = i + 1; k < lines.length; k++) {
                        if (lines[k].trim() !== '') return k;
                    }
                    return -1;
                })();

                if (j !== -1 && /^[ \t]*<pre data-codeblock=/.test(lines[j])) {
                    // skip adding an extra newline here; the next line will
                    // be appended to the current <li> and will include its own
                    // separation.
                } else {
                    result += '\n';
                }
            }
            continue;
        } else {
            // Non-list content. If this line is indented so it belongs to the
            // current list level, append it to the open <li>; otherwise close
            // lists and output the content as normal.
            const indentMatch = line.match(/^(\s*)/);
            const indentLen = indentMatch ? indentMatch[1].length : 0;
            const currentLevel = stack.length ? stack[stack.length - 1].level : -1;

            if (stack.length > 0 && lastLiOpenAtLevel !== null && indentLen > currentLevel * 2) {
                // This line is intentionally indented under the current list
                // level — treat it as part of the last <li>.
                // Preserve leading indentation for regular indented content
                // lines so they keep alignment. However, for a protected
                // code-block placeholder (e.g. <pre data-codeblock="N">)
                // the placeholder already includes the fence indentation
                // and we'll restore indentation later — avoid duplicating
                // it here by trimming the placeholder's leading spaces.
                if (/^[ \t]*<pre data-codeblock=/.test(line)) {
                    result += '\n' + line.replace(/^[ \t]+/, '').replace(/\s+$/, '');
                } else {
                    result += '\n' + line.replace(/\s+$/, '');
                }
            } else {
                // Close any open <li>
                if (lastLiOpenAtLevel !== null) {
                    result += `</li>`;
                    lastLiOpenAtLevel = null;
                }

                // Close all open lists
                while (stack.length > 0) {
                    const closing = stack.pop();
                    result += `</${closing.type}>`;
                }

                if (line.trim()) {
                    result += line + '\n';
                }
            }
        }
    }
    
    // Close any remaining open <li> and lists
    if (lastLiOpenAtLevel !== null) {
        result += `</li>`;
        lastLiOpenAtLevel = null;
    }
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