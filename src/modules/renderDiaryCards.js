import { sortByDate } from './dateUtils.js';

function calculateReadTime(content) {
    const wordsPerMinute = 150; // Average reading speed
    const wordCount = typeof content === 'string' ? content.split(/\s+/).length : 0; // Ensure content is a string
    return Math.ceil(wordCount / wordsPerMinute);
}

// Security: HTML escape helper for use in template literals
// Escapes characters that could break HTML or enable XSS
// Note: Single quotes (apostrophes) are NOT escaped as they're safe in HTML content
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Security: Validate entry data
function validateEntry(entry) {
    return entry && 
           typeof entry.title === 'string' &&
           typeof entry.date === 'string' &&
           typeof entry.id === 'string' &&
           typeof entry.week === 'string' &&
           typeof entry.summary === 'string' &&
           typeof entry.slug === 'string' &&
           Array.isArray(entry.tags);
}

export async function renderDiaryCards() {
    const listEl = document.getElementById('diary-cards');
    const tagButtonsContainer = document.getElementById('tag-buttons');
    if (!listEl || !tagButtonsContainer) {
        return;
    }

    try {
        const response = await fetch('/diary/index.json');
        if (!response.ok) throw new Error('Failed to fetch diary entries.');

        const entries = await response.json();
        
        // Validate entries
        const validEntries = entries.filter(validateEntry);
        if (validEntries.length !== entries.length) {
            console.warn('Some diary entries failed validation and were filtered out');
        }

        // Sort entries by date descending (most recent first) - handles Finnish date format
        sortByDate(validEntries, 'date');

        // Count tags and their occurrences
        const tagCounts = {};
        validEntries.forEach(entry => {
            entry.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        // Generate tag buttons dynamically
        const tagButtonsHTML = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by popularity
            .map(([tag, count]) => `
                <button class="tag-button" data-tag="${escapeHtml(tag)}">
                    ${escapeHtml(tag)} (${count})
                </button>
            `)
            .join('');

        // Add "All Posts" button and tag buttons
        tagButtonsContainer.innerHTML = `
            <button class="tag-button active" data-tag="all">All Posts</button>
            ${tagButtonsHTML}
        `;

        // Render all posts initially
        renderPosts(validEntries);

        // Add event listeners to tag buttons
        document.querySelectorAll('.tag-button').forEach(button => {
            button.addEventListener('click', () => {
                const tag = button.getAttribute('data-tag');

                // Set the active state
                document.querySelectorAll('.tag-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Filter posts based on the selected tag
                if (tag === 'all') {
                    renderPosts(validEntries); // Show all posts
                } else {
                    // Sort filtered entries by date descending - handles Finnish date format
                    const filteredEntries = validEntries.filter(entry => entry.tags.includes(tag));
                    sortByDate(filteredEntries, 'date');
                    renderPosts(filteredEntries); // Show filtered posts
                }
            });
        });

        async function renderPosts(posts) {
            try {
                const cardsHTML = await Promise.all(posts.map(async entry => {
                    let content = "";
                    try {
                        const contentResponse = await fetch(`/diary/entries/${encodeURIComponent(entry.slug)}.md`);
                        content = contentResponse.ok ? await contentResponse.text() : "";
                    } catch (error) {
                        console.warn(`Failed to fetch content for ${entry.slug}:`, error);
                    }

                    const readTime = calculateReadTime(content);
                    const searchableData = `${entry.title.toLowerCase()} ${entry.date.toLowerCase()} ${entry.tags.join(' ').toLowerCase()}`;

                    return `
                    <div class="diary-list" data-searchable="${escapeHtml(searchableData)}">
                        <a href="./entries/diary.html?entry=${encodeURIComponent(entry.slug)}&week=${encodeURIComponent(entry.week)}">
                            <div class="header">
                                <h3 class="h3">${escapeHtml(entry.date)}</h3>
                                <h3 class="h3">${escapeHtml(entry.id)}</h3>
                            </div>
                            <div class="content">
                                <h2 class="medium-card-header">${escapeHtml(entry.title)}</h2>
                                <h2 class="h3">${escapeHtml(entry.week)}</h2>
                                <p class="paragraph">${escapeHtml(entry.summary)}</p>
                            </div>
                            <div class="space-50"></div>
                            <div class="container">
                                <div class="tags">
                                    ${entry.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')} 
                                </div>
                                <p class="read-time">~${readTime} min read</p>
                            </div>
                        </a>
                    </div>
                `;
                }));

                listEl.innerHTML = cardsHTML.join('');
            } catch (error) {
                console.error('Error rendering posts:', error);
                listEl.innerHTML = '<p>Error loading diary entries.</p>';
            }
        }

    } catch (error) {
        console.error('Error loading diary cards:', error);
        if (listEl) {
            listEl.innerHTML = '<p>Error loading diary entries.</p>';
        }
    }
}