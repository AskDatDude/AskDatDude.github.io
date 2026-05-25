// Back to Top Button Functionality
export function initBackToTop() {
    const backToTopButtons = document.querySelectorAll('.back-to-top');
    
    if (backToTopButtons.length === 0) {
        return; // No button on this page
    }

    const footer = document.getElementById('footer');
    
    // Calculate when to show button and position it above footer
    function updateButtonVisibility() {
        backToTopButtons.forEach(button => {
            const isProjectPage = button.classList.contains('project-page');
            const scrollY = window.scrollY;

            let showThreshold = 300;
            
            if (isProjectPage) {
                showThreshold = 1300;
            }
            
            // Check if we should show the button
            const shouldShow = scrollY > showThreshold;
            
            // Position button to stop at footer (not overlap or disappear)
            if (footer && shouldShow) {
                const footerRect = footer.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const buttonHeight = 50; // Height of the button
                const bottomMargin = 30; // Normal bottom margin
                
                // Calculate how far the footer has entered the viewport
                const footerDistanceFromBottom = windowHeight - footerRect.top;
                
                // If footer is entering the viewport
                if (footerDistanceFromBottom > 0) {
                    // Stop the button above the footer
                    const newBottom = footerDistanceFromBottom + bottomMargin;
                    button.style.bottom = `${newBottom}px`;
                } else {
                    // Normal fixed positioning
                    button.style.bottom = `${bottomMargin}px`;
                }
            }
            
            // Show/hide button based on scroll position
            if (shouldShow) {
                button.classList.add('visible');
            } else {
                button.classList.remove('visible');
            }
        });
    }

    // Show/hide button based on scroll position
    window.addEventListener('scroll', updateButtonVisibility);
    
    // Also update on resize
    window.addEventListener('resize', updateButtonVisibility);
    
    // Initial check
    updateButtonVisibility();

    // Scroll to top when button is clicked
    backToTopButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
}
