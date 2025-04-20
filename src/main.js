import { loadHeaderFooter } from './modules/loadHeaderFooter.js';
import { initCursorEffect } from './modules/cursor.js';
import { initLoadingScreen } from './modules/loadingScreen.js';
import { initLoadMore } from './modules/loadMore.js';
import { initSearchBar } from './modules/searchBar.js';
import { initLastModified } from './modules/lastModified.js';
import { initClassTabs } from './modules/classTabs.js';
import { renderDiaryEntry } from './diary/viewer.js';
import { updateJsonDate } from './modules/updateDate.js';
import { renderDiaryCards } from './modules/renderDiaryCards.js';



document.addEventListener('DOMContentLoaded', () => {
    loadHeaderFooter(() => {
        initLastModified();
    });
    initCursorEffect();
    initLoadingScreen();
    initLoadMore();
    initSearchBar('#search', '[data-searchable]');
    initClassTabs();
    updateJsonDate();
    renderDiaryCards();

    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (path.endsWith("diary.html")) {
        const entry = params.get("entry");
        if (entry) renderDiaryEntry(entry);
    }
});