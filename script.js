
// CURSOR EFFECT

let div = document.querySelector(".cursor");
window.addEventListener("mousemove", (e) => {
    let x = e.pageX - 25;
    let y = e.pageY - 15;
    div.style.transform = `translate(${x}px, ${y}px)`;
    div.style.opacity = 1;
});

window.addEventListener("mouseout", () => {
    div.style.opacity = 0;
});





// LOADING SCREEN


document.addEventListener("DOMContentLoaded", function() {
    // Show the loading screen for 1 second
    setTimeout(function() {
        // Add class to fade out the loading screen
        document.getElementById('loading-screen').classList.add('hidden');
        // Add class to fade in the main content
        document.getElementsByClassName('main-content').classList.add('visible');
    }, 1000); // 1000 milliseconds = 1 second
});



// LOAD MORE BUTTON

document.addEventListener("DOMContentLoaded", function() {
    const loadMoreButton = document.querySelector(".load-more-button");
    const cards = document.querySelectorAll(".big-card-box");
    let currentCardIndex = 0;
    const cardsToShow = 4; // Number of cards to show each time the button is clicked

    function showCards() {
        const nextCardIndex = currentCardIndex + cardsToShow;
        for (let i = currentCardIndex; i < nextCardIndex && i < cards.length; i++) {
            setTimeout(() => {
                cards[i].style.display = 'block';
                requestAnimationFrame(() => {
                    cards[i].style.opacity = 1;
                    cards[i].style.transform = 'translateY(0)';
                });
            }, (i - currentCardIndex) * 300); // Stagger the animation by 300ms
        }
        currentCardIndex = nextCardIndex;
        if (currentCardIndex >= cards.length) {
            loadMoreButton.style.display = 'none';
        }
    }

    loadMoreButton.addEventListener("click", showCards);

    // Show initial cards
    showCards();
});

// SEARCH BAR

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector("[data-search]");

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const value = e.target.value.toLowerCase();
            
            document.querySelectorAll("[data-searchable]").forEach((el) => {
                el.style.display = el.textContent.toLowerCase().includes(value) ? "block" : "none";
            });
        });
    } else {
        console.error('Element with [data-search] not found');
    }
});

// LAST MODIFIED DATE

document.addEventListener("DOMContentLoaded", function() {
    let myDate = "2025-22-01"; // Date of last modification

    document.getElementById("displayDate").innerText = myDate;
});

document.addEventListener("DOMContentLoaded", function() {
    let version = "V2.1.2" // Version number

    document.getElementById("version").innerText = version;
});



// CLASS TABS

function openClass(evt, className) {
    var i, x, tablinks;
    x = document.getElementsByClassName("class");
    for (i = 0; i < x.length; i++) {
      x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < x.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(className).style.display = "block";
    evt.currentTarget.className += " active";
  }


  // BREADCRUMBS 