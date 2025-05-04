function calculateReadTime(content) {
    const wordsPerMinute = 150; // Average reading speed
    const wordCount = typeof content === 'string' ? content.split(/\s+/).length : 0; // Ensure content is a string
    return Math.ceil(wordCount / wordsPerMinute);
}

export async function renderDiaryCards() {
    const listEl = document.getElementById('diary-cards');
    const tagButtonsContainer = document.getElementById('tag-buttons');
    if (!listEl || !tagButtonsContainer) {
        return;
    }

    const response = await fetch('/diary/index.json');
    if (!response.ok) throw new Error('Failed to fetch diary entries.');

    const entries = await response.json();

    // Sort entries by date descending (most recent first)
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Count tags and their occurrences
    const tagCounts = {};
    entries.forEach(entry => {
        entry.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    // Generate tag buttons dynamically
    const tagButtonsHTML = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by popularity
        .map(([tag, count]) => `
            <button class="tag-button" data-tag="${tag}">
                ${tag} (${count})
            </button>
        `)
        .join('');

    // Add "All Posts" button and tag buttons
    tagButtonsContainer.innerHTML = `
        <button class="tag-button active" data-tag="all">All Posts</button>
        ${tagButtonsHTML}
    `;

    // Render all posts initially
    renderPosts(entries);

    // Add event listeners to tag buttons
    document.querySelectorAll('.tag-button').forEach(button => {
        button.addEventListener('click', () => {
            const tag = button.getAttribute('data-tag');

            // Set the active state
            document.querySelectorAll('.tag-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Filter posts based on the selected tag
            if (tag === 'all') {
                renderPosts(entries); // Show all posts
            } else {
                // Sort filtered entries by date descending
                const filteredEntries = entries.filter(entry => entry.tags.includes(tag)).sort((a, b) => new Date(b.date) - new Date(a.date));
                renderPosts(filteredEntries); // Show filtered posts
            }
        });
    });

    async function renderPosts(posts) {
        const cardsHTML = await Promise.all(posts.map(async entry => {
            const contentResponse = await fetch(`/diary/entries/${entry.slug}.md`);
            const content = contentResponse.ok ? await contentResponse.text() : "";

            const readTime = calculateReadTime(content);

            return `
            <div class="diary-list" data-searchable="${entry.title.toLowerCase()} ${entry.date.toLowerCase()} ${entry.tags.join(' ').toLowerCase()}">
                <a href="./entries/diary.html?entry=${entry.slug}&week=${encodeURIComponent(entry.week)}">
                    <div class="header">
                        <h3 class="h3">${entry.date}</h3>
                        <h3 class="h3">${entry.id}</h3>
                    </div>
                    <div class="content">
                        <h2 class="medium-card-header">${entry.title}</h2>
                        <h2 class="h3">${entry.week}</h2>
                        <p class="paragraph">${entry.summary}</p>
                        <div class="space-50"></div>
                    </div>
                    <div class="container">
                        <div class="tags">
                            ${entry.tags.map(tag => `<span class="tag"> ${tag}</span>`).join('')} 
                        </div>
                        <p class="read-time">~${readTime} min read</p>
                    </div>
                </a>
            </div>
        `;
        }));

        listEl.innerHTML = cardsHTML.join('');
    }
}