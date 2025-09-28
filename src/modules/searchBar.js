export function initSearchBar(searchInputSelector, searchableSelector) {
    const searchInput = document.querySelector(searchInputSelector);
    if (!searchInput) {
        console.warn(`Search input element not found: ${searchInputSelector}`);
        return;
    }

    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase().trim();
        const searchableElements = document.querySelectorAll(searchableSelector);
        
        searchableElements.forEach((el) => {
            const searchableText = el.getAttribute('data-searchable') || el.textContent;
            const isVisible = searchableText.toLowerCase().includes(value);
            el.style.display = isVisible ? 'block' : 'none';
        });
    });
}