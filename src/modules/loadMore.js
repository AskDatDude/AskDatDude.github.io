export function initLoadMore() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            runLoadMoreLogic();
        });
    } else {
        runLoadMoreLogic();
    }
}

function runLoadMoreLogic() {
    const loadMoreButton = document.querySelector(".load-more-button");
    const cards = document.querySelectorAll(".big-card-box");
    if (!loadMoreButton || cards.length === 0) {
        return;
    }

    let currentCardIndex = 0;
    const cardsToShow = 4;

    function showCards() {
        const nextCardIndex = currentCardIndex + cardsToShow;
        for (let i = currentCardIndex; i < nextCardIndex && i < cards.length; i++) {
            cards[i].style.display = 'block'; // Make the card visible
            requestAnimationFrame(() => {
                cards[i].style.opacity = 1; // Fade in the card
                cards[i].style.transform = 'translateY(0)'; // Slide the card into place
            });
        }
        currentCardIndex = nextCardIndex;
        if (currentCardIndex >= cards.length) {
            loadMoreButton.style.display = 'none'; // Hide the button if all cards are shown
        }
    }

    loadMoreButton.addEventListener("click", showCards);
    showCards(); // Initial call to show the first set of cards
}