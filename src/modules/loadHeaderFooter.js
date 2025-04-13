export async function loadHeaderFooter(onFooterLoaded) {
    const headerPlaceholder = document.getElementById('header');
    const footerPlaceholder = document.getElementById('footer');
    const haederBack = document.getElementById('header-back');

    if (headerPlaceholder) {
        const headerResponse = await fetch('/src/modules/header.html');
        const headerHTML = await headerResponse.text();
        headerPlaceholder.innerHTML = headerHTML;
    } else {
        console.error("Element with id 'header' not found.");
    }

    if (haederBack) {
        const headerBackResponse = await fetch('/src/modules/header-back.html');
        const headerBackHTML = await headerBackResponse.text();
        haederBack.innerHTML = headerBackHTML;
    }
    else {
        console.error("Element with id 'header-back' not found.");
    }

    if (footerPlaceholder) {
        const footerResponse = await fetch('/src/modules/footer.html');
        const footerHTML = await footerResponse.text();
        footerPlaceholder.innerHTML = footerHTML;

        // Call the callback function after the footer is loaded
        if (typeof onFooterLoaded === 'function') {
            onFooterLoaded();
        }
    } else {
        console.error("Element with id 'footer' not found.");
    }
}