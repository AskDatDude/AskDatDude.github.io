// Make a request to ipinfo.io API

fetch('https://ipinfo.io/json?token=017eabb2d4d850')
    .then(response => {
        // Check if response is ok
        if (!response.ok) {
            throw new Error('Error fetching IP information');
        }
        return response.json();
    })
    .then(data => {
        // Display IP address
        document.getElementById('ip-address').innerText = data.ip;

        // Display other information
        document.getElementById('hostname').innerText = data.hostname;
        document.getElementById('city').innerText = data.city;
        document.getElementById('region').innerText = data.region;
        document.getElementById('country').innerText = data.country;
        document.getElementById('org').innerText = data.org;
        document.getElementById('postal').innerText = data.postal;
        document.getElementById('timezone').innerText = data.timezone;

        document.getElementById('ip-address2').innerText = data.ip;
        document.getElementById('hostname2').innerText = data.hostname;
        document.getElementById('city2').innerText = data.city;
        document.getElementById('region2').innerText = data.region;
        document.getElementById('country2').innerText = data.country;
        document.getElementById('org2').innerText = data.org;
        document.getElementById('postal2').innerText = data.postal;
        document.getElementById('timezone2').innerText = data.timezone;
    })
    .catch(error => {
        let infoSection = document.getElementsByClassName('info-section');
        if (infoSection.length > 0) {
            infoSection[0].style.display = 'none';
        }
        console.error('Error fetching IP information, turn off any addblockers and VPNs:', error);

    });




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

const lastUpdatedDate = '2024-10-22'; // Set your desired date here
    document.getElementById('date').innerText = lastUpdatedDate;