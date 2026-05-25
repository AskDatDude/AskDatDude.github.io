import { simpleMarkdownToHtml, extractFrontmatter, sanitizeText, escapeHtml } from './diaryViewer.js';

export async function renderProjectPage(projectSlug) {
    // Security: Validate filename
    if (!isValidFilename(projectSlug)) {
        console.error(`Invalid project slug: ${projectSlug}`);
        return;
    }

    try {
        const response = await fetch(`/projects/${projectSlug}.md`);
        if (!response.ok) {
            console.error(`Failed to fetch project: ${projectSlug}`);
            document.getElementById('project-content').innerHTML = '<p>Project not found.</p>';
            return;
        }

        const md = await response.text();
        const metadata = extractFrontmatter(md);
        const content = md.replace(/<!--- metadata\s*\n[\s\S]*?\n\s*--->/, ""); // Remove metadata block

        // Render the project page
        renderProjectMetadata(metadata);
        renderProjectInfo(metadata);
        renderProjectButtons(metadata);
        renderProjectContent(content);
        generateTableOfContents(content);

        // Highlight code blocks
        if (window.Prism) {
            Prism.highlightAll();
        }
    } catch (error) {
        console.error('Error rendering project:', error);
        document.getElementById('project-content').innerHTML = '<p>Error loading project.</p>';
    }
}

function renderProjectMetadata(metadata) {
    // Set hero image
    const heroImg = document.getElementById('project-hero-img');
    if (heroImg && metadata.image) {
        // Handle both absolute and relative paths
        const imagePath = metadata.image.startsWith('/') ? metadata.image : `/${metadata.image}`;
        heroImg.src = imagePath;
        heroImg.alt = sanitizeText(metadata.imageAlt || metadata.title || 'Project image');
    }

    // Set title and subtitle
    const titleEl = document.getElementById('project-title');
    const subtitleEl = document.getElementById('project-subtitle');
    
    if (titleEl) titleEl.textContent = sanitizeText(metadata.title) || "Untitled Project";
    if (subtitleEl) subtitleEl.textContent = sanitizeText(metadata.subtitle) || "";

    // Set description (from summary or first paragraph)
    const descriptionEl = document.getElementById('project-description');
    if (descriptionEl && metadata.summary) {
        descriptionEl.textContent = sanitizeText(metadata.summary);
    }

    // Update page title
    document.title = `${metadata.title || 'Project'} - Robin Niinemets`;
}

function renderProjectInfo(metadata) {
    const infoContainer = document.getElementById('project-info');
    if (!infoContainer) return;

    let infoHTML = '';

    // Render info sections from metadata
    const infoSections = [
        { key: 'creators', label: 'Creators' },
        { key: 'collaborators', label: 'Collaborators' },
        { key: 'duration', label: 'Duration' },
        { key: 'tools', label: 'Tools' },
        { key: 'date', label: 'Date' },
        { key: 'originalSource', label: 'Original Source' }
    ];

    infoSections.forEach(section => {
        if (metadata[section.key]) {
            const value = metadata[section.key];
            let content = '';

            if (Array.isArray(value)) {
                // If it's an array, render each item as a separate h3
                content = value.map(item => 
                    `<h3 class="paragraph">${escapeHtml(item)}</h3>`
                ).join('');
            } else {
                content = `<h3 class="paragraph">${escapeHtml(value)}</h3>`;
            }

            infoHTML += `
                <div class="group">
                    <h2 class="h2">${escapeHtml(section.label)}</h2>
                    ${content}
                </div>
            `;
        }
    });

    infoContainer.innerHTML = infoHTML;
}

function renderProjectButtons(metadata) {
    const buttonsContainer = document.getElementById('project-buttons');
    if (!buttonsContainer) return;

    let buttonsHTML = '';

    // Check if buttons array exists in metadata
    if (metadata.buttons && Array.isArray(metadata.buttons)) {
        metadata.buttons.forEach(button => {
            if (button.text && button.url) {
                buttonsHTML += `
                    <div class="button-container-2">
                        <button class="button paragraph-caps">
                            <a href="${escapeHtml(button.url)}" target="_blank" rel="noreferrer">${escapeHtml(button.text)}</a>
                            <a class="arrow">&#8250;</a>
                        </button>
                    </div>
                `;
            }
        });
    }

    buttonsContainer.innerHTML = buttonsHTML;
}

function renderProjectContent(content) {
    const contentEl = document.getElementById('project-content');
    if (!contentEl) return;

    // Convert markdown to HTML
    contentEl.innerHTML = simpleMarkdownToHtml(content);
}

function generateTableOfContents(content) {
    const tocList = document.getElementById('toc-list');
    if (!tocList) return;

    // Extract headers from content
    const headers = [];
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headerRegex.exec(content)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        
        // Skip h2 headers (level 2) - only include h3 and deeper
        if (level === 2) continue;
        
        // Generate an ID from the header text
        const id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);

        headers.push({ level, text, id });
    }

    if (headers.length === 0) {
        // Hide TOC if no headers found
        const tocContainer = document.getElementById('table-of-contents');
        if (tocContainer) {
            tocContainer.style.display = 'none';
        }
        return;
    }

    // Generate TOC HTML
    let tocHTML = '';
    headers.forEach(header => {
        tocHTML += `
            <li>
                <a href="#${escapeHtml(header.id)}">
                    <span class="h2-toc">${escapeHtml(header.text)}</span>
                </a>
            </li>
        `;
    });

    tocList.innerHTML = tocHTML;

    // Add IDs to the actual headers in the content
    const contentEl = document.getElementById('project-content');
    if (contentEl) {
        headers.forEach(header => {
            // Find the header by text content and add ID
            const headerElements = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headerElements.forEach(el => {
                if (el.textContent.trim() === header.text) {
                    el.id = header.id;
                }
            });
        });
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
