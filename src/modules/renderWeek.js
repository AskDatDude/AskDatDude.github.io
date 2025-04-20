export function renderWeek(containerSelector = '.week-entry') {
    const urlParams = new URLSearchParams(window.location.search);
    const week = urlParams.get('week');

    if (week) {
        const container = document.querySelector(containerSelector);
        if (container) {
            const weekElement = document.createElement('p');
            weekElement.className = 'entry-week';
            weekElement.textContent = `${week}`;
            container.appendChild(weekElement); // Append as the last child by default
        } else {
            console.error(`Container with selector "${containerSelector}" not found.`);
        }
    }
}