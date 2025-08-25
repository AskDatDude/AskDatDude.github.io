export async function renderToolboxCards() {
    const listEl = document.getElementById('toolbox-cards');
    const tagButtonsContainer = document.getElementById('tag-buttons');
    if (!listEl || !tagButtonsContainer) {
        return;
    }

    try {
        const response = await fetch('/toolbox/index.json');
        if (!response.ok) throw new Error('Failed to fetch toolbox entries.');

        const tools = await response.json();

        // Sort tools alphabetically by title
        tools.sort((a, b) => a.title.localeCompare(b.title));

        // Count tags and their occurrences
        const tagCounts = {};
        tools.forEach(tool => {
            tool.tags.forEach(tag => {
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

        // Add "All Tools" button and tag buttons
        tagButtonsContainer.innerHTML = `
            <button class="tag-button active" data-tag="all">All Tools</button>
            ${tagButtonsHTML}
        `;

        // Render all tools initially
        renderTools(tools);

        // Add event listeners to tag buttons
        document.querySelectorAll('.tag-button').forEach(button => {
            button.addEventListener('click', () => {
                const tag = button.getAttribute('data-tag');

                // Set the active state
                document.querySelectorAll('.tag-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Filter tools based on the selected tag
                if (tag === 'all') {
                    renderTools(tools); // Show all tools
                } else {
                    // Sort filtered tools alphabetically
                    const filteredTools = tools.filter(tool => tool.tags.includes(tag)).sort((a, b) => a.title.localeCompare(b.title));
                    renderTools(filteredTools); // Show filtered tools
                }
            });
        });

        function renderTools(toolsToRender) {
            const cardsHTML = toolsToRender.map(tool => {
                return `
                <div class="diary-list tool-card" data-searchable="${tool.title.toLowerCase()} ${tool.description.toLowerCase()} ${tool.tags.join(' ').toLowerCase()} ${tool.category.toLowerCase()}">
                    <a href="./${tool.slug}/">
                        <div class="header">
                            <h3 class="h3">${tool.icon}</h3>
                            <h3 class="h3">${tool.category}</h3>
                        </div>
                        <div class="content">
                            <h2 class="medium-card-header">${tool.title}</h2>
                            <p class="paragraph">${tool.description}</p>
                        </div>
                        <div class="space-50"></div>
                        <div class="container">
                            <div class="tags">
                                ${tool.tags.map(tag => `<span class="tag"> ${tag}</span>`).join('')} 
                            </div>
                        </div>
                    </a>
                </div>
            `;
            }).join('');

            listEl.innerHTML = cardsHTML;
        }

    } catch (error) {
        console.error('Error loading toolbox:', error);
        listEl.innerHTML = '<div class="error">Failed to load tools. Please try again later.</div>';
    }
}
