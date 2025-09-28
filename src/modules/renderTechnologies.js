export async function renderTechnologies() {
    const toolsContainer = document.getElementById('technologies-tools');
    const languagesContainer = document.getElementById('coding-languages');
    
    if (!toolsContainer || !languagesContainer) {
        return;
    }

    try {
        const response = await fetch('/src/data/technologies.json');
        if (!response.ok) throw new Error('Failed to fetch technologies data.');

        const technologies = await response.json();

        // Separate technologies by category
        const tools = technologies.filter(tech => tech.category === 'tools');
        const languages = technologies.filter(tech => tech.category === 'languages');

        // Render tools
        const toolsHTML = tools.map(tech => `
            <div class="medium-card">
                <a href="${tech.url}">
                    <div class="row">
                        <img src="${tech.icon}" alt="${tech.iconAlt}">
                        <div class="column">
                            <h3 class="medium-card-header">${tech.name}</h3>
                            <h4 class="h2">${tech.description}</h4>
                        </div>
                        <div class="column">
                            <h4 class="h2">Level</h4>
                            <h5 class="paragraph">${tech.level}</h5>
                        </div>
                    </div>
                </a>
            </div>
        `).join('');

        // Render languages
        const languagesHTML = languages.map(tech => {
            const formattedDescription = tech.description.replace(/\s/g, '&nbsp;');
            return `
                <div class="medium-card">
                    <a href="${tech.url}">
                        <div class="row">
                            <img src="${tech.icon}" alt="${tech.iconAlt}">
                            <div class="column">
                                <h3 class="medium-card-header">${tech.name}</h3>
                                <h4 class="h2">${formattedDescription}</h4>
                            </div>
                            <div class="column">
                                <h4 class="h2">Level</h4>
                                <h5 class="paragraph">${tech.level}</h5>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        }).join('');

        toolsContainer.innerHTML = toolsHTML;
        languagesContainer.innerHTML = languagesHTML;

    } catch (error) {
        console.error('Error rendering technologies:', error);
        toolsContainer.innerHTML = '<p>Error loading technologies data.</p>';
        languagesContainer.innerHTML = '<p>Error loading languages data.</p>';
    }
}