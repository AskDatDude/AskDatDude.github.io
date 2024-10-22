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

document.addEventListener("DOMContentLoaded", function() {
    let myDate = "2024-10-22"; // Date of last modification

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

  function generateBreadcrumb() {
    const breadcrumbContainer = document.getElementById('breadcrumb');
    const path = window.location.pathname.split('/').filter(Boolean); // Get URL path segments
  
    // Create the Home breadcrumb item
    const homeCrumb = document.createElement('li');
    homeCrumb.classList.add('home-icon');
    const homeLink = document.createElement('a');
    homeLink.href = '/'; // Home link URL
    homeLink.innerText = 'Home'; // Home breadcrumb text
    homeCrumb.appendChild(homeLink);
    breadcrumbContainer.appendChild(homeCrumb);
  
    // Loop through the URL path and generate breadcrumbs
    path.forEach((segment, index) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
  
      // Format the breadcrumb text by capitalizing the first letter of each segment
      const title = segment.charAt(0).toUpperCase() + segment.slice(1);
      a.innerText = title;
  
      // Construct the URL for each breadcrumb up to this point in the path
      const url = '/' + path.slice(0, index + 1).join('/');
      a.href = url;
      li.appendChild(a);
      breadcrumbContainer.appendChild(li);
    });
  
    // Mark the last breadcrumb as the current page (no link)
    const currentPage = breadcrumbContainer.lastChild;
    if (currentPage) {
      currentPage.querySelector('a').removeAttribute('href');
      currentPage.querySelector('a').classList.add('active');
    }
  }
  
  // Call the function to generate the breadcrumb when the page loads
  generateBreadcrumb();