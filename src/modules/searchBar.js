export function initSearchBar(searchInputSelector, searchableSelector) {
    const searchInput = document.querySelector(searchInputSelector);
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            document.querySelectorAll(searchableSelector).forEach((el) => {
                const isVisible = el.textContent.toLowerCase().includes(value);
                el.style.display = isVisible ? 'block' : 'none';
            });
        });
    }
}

function runSearchBarLogic() {
    const searchInput = document.querySelector("[data-search]");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {

            const value = e.target.value.toLowerCase();
            document.querySelectorAll("[data-searchable]").forEach((el) => {
                const isVisible = el.textContent.toLowerCase().includes(value);
                el.style.display = isVisible ? "block" : "none";
            });
        });
    } 
    
}