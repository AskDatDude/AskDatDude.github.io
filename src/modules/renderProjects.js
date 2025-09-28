export async function renderProjects() {
    const projectsContainer = document.getElementById('projects-grid');
  
    
    try {
        const response = await fetch('/src/data/projects.json');
        if (!response.ok) throw new Error('Failed to fetch projects data.');
        const projects = await response.json();

        // Sort projects by date descending (most recent first)
        projects.sort((a, b) => new Date(b.date) - new Date(a.date));

        const projectsHTML = projects.map((project, index) => {
            const tagsHTML = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
            const searchableData = `${project.title.toLowerCase()} ${project.subtitle.toLowerCase()} ${project.tags.join(' ').toLowerCase()}`;

            // Hide cards after the first 4 initially
            const isInitiallyVisible = index < 4;
            const visibilityClass = isInitiallyVisible ? 'project-visible' : 'project-hidden';
            
            return `
                <div class="big-card-box ${visibilityClass}" data-searchable="${searchableData}">
                    <a href="${project.url}">
                        <div class="header">
                            <h2 class="h3">${project.date}</h2>
                            <h2 class="h3">ID ${project.id}</h2>
                        </div>
                        <img src="${project.image}" alt="${project.imageAlt}">
                        <h2 class="big-card-header">${project.title}</h2>
                        <h3 class="h2">${project.subtitle}</h3>
                        <div class="tags">
                            ${tagsHTML}
                        </div>
                    </a>
                </div>
            `;
        }).join('');

        projectsContainer.innerHTML = projectsHTML;

        // Initialize load more functionality after rendering
        initProjectsLoadMore();

    } catch (error) {
        projectsContainer.innerHTML = '<p class="project-error">Error loading projects data: ' + error.message + '</p>';
    }
}

function initProjectsLoadMore() {
    const loadMoreButton = document.querySelector(".load-more-button");
    const cards = document.querySelectorAll(".big-card-box");
    
    if (!loadMoreButton || cards.length === 0) {
        return;
    }

    // Count how many cards are initially visible
    const initiallyVisibleCards = Array.from(cards).filter(card => 
        card.classList.contains('project-visible')
    ).length;
    
    let currentCardIndex = initiallyVisibleCards; // Start from after the initially visible cards
    const cardsToShow = 2; // Show fewer cards at a time for better effect

    function showCards() {
        const nextCardIndex = currentCardIndex + cardsToShow;
        for (let i = currentCardIndex; i < nextCardIndex && i < cards.length; i++) {
            const card = cards[i];
            
            // Use a longer delay for slower staggered animation effect
            setTimeout(() => {
                // Step 1: Remove hidden class and add loading class
                card.classList.remove('project-hidden');
                card.classList.add('project-loading');
                
                // Step 2: Force reflow and then add visible class
                requestAnimationFrame(() => {
                    card.offsetHeight; // Force reflow
                    card.classList.remove('project-loading');
                    card.classList.add('project-visible');
                });
            }, (i - currentCardIndex) * 200); // Increased stagger to 200ms per card for slower animation
        }
        currentCardIndex = nextCardIndex;
        if (currentCardIndex >= cards.length) {
            loadMoreButton.style.display = 'none'; // Hide the button if all cards are shown
        }
    }

    // Show/hide load more button based on total cards vs initially visible
    if (cards.length <= initiallyVisibleCards) {
        loadMoreButton.style.display = 'none';
    } else {
        loadMoreButton.style.display = 'block';
        loadMoreButton.addEventListener("click", showCards);
    }
}