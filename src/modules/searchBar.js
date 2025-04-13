export function initSearchBar() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            runSearchBarLogic();
        });
    } else {
        runSearchBarLogic();
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