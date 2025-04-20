import { loadHeaderFooter } from './modules/loadHeaderFooter.js';
import { initCursorEffect } from './modules/cursor.js';
import { initLoadingScreen } from './modules/loadingScreen.js';
import { initLoadMore } from './modules/loadMore.js';
import { initSearchBar } from './modules/searchBar.js';
import { initLastModified } from './modules/lastModified.js';
import { renderDiaryEntry } from './diary/viewer.js';
import { updateJsonDate } from './modules/updateDate.js';
import { renderDiaryCards } from './modules/renderDiaryCards.js';
import { initClassTabs } from './modules/classTabs.js';
import { renderWeek } from './modules/renderWeek.js';

document.addEventListener('DOMContentLoaded', () => {
    loadHeaderFooter(() => {
        initLastModified();
    });
    initCursorEffect();
    initLoadingScreen();
    initLoadMore();
    initSearchBar('#search', '[data-searchable]');
    initClassTabs(); // Ensure this function is called
    updateJsonDate();
    renderDiaryCards();
    // Check if the current page is diary.html
    if (window.location.pathname.includes('/diary/entries/diary.html')) {
        renderWeek('.week-entry'); // Pass the selector for the week entry
    }

    // Extract the filename from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const entryFilename = urlParams.get('entry');
    if (entryFilename) {
        renderDiaryEntry(`${entryFilename}`);
    }
});