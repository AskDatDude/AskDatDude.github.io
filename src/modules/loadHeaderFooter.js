export async function loadHeaderFooter(onFooterLoaded) {
    const headerPlaceholder = document.getElementById('header');
    const footerPlaceholder = document.getElementById('footer');
    const headerBack = document.getElementById('header-back'); // Fixed typo

    try {
        if (headerPlaceholder) {
            const headerResponse = await fetch('/src/modules/header.html');
            if (headerResponse.ok) {
                const headerHTML = await headerResponse.text();
                headerPlaceholder.innerHTML = headerHTML;
            } else {
                console.error('Failed to load header:', headerResponse.status);
            }
        }

        if (headerBack) {
            const headerBackResponse = await fetch('/src/modules/header-back.html');
            if (headerBackResponse.ok) {
                const headerBackHTML = await headerBackResponse.text();
                headerBack.innerHTML = headerBackHTML;
            } else {
                console.error('Failed to load header-back:', headerBackResponse.status);
            }
        }

        if (footerPlaceholder) {
            const footerResponse = await fetch('/src/modules/footer.html');
            if (footerResponse.ok) {
                const footerHTML = await footerResponse.text();
                footerPlaceholder.innerHTML = footerHTML;

                // Call the callback function after the footer is loaded
                if (typeof onFooterLoaded === 'function') {
                    onFooterLoaded();
                }
            } else {
                console.error('Failed to load footer:', footerResponse.status);
            }
        }
    } catch (error) {
        console.error('Error loading header/footer:', error);
    }
}