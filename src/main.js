import { loadHeaderFooter } from './modules/loadHeaderFooter.js';
import { initCursorEffect } from './modules/cursor.js';
import { initLoadingScreen } from './modules/loadingScreen.js';
import { initLoadMore } from './modules/loadMore.js';
import { initSearchBar } from './modules/searchBar.js';
import { initLastModified } from './modules/lastModified.js';
import { initClassTabs } from './modules/classTabs.js';



// Load the header and footer
document.addEventListener('DOMContentLoaded', () => {
    loadHeaderFooter(() => {
        initLastModified();
    });
    initCursorEffect();
    initLoadingScreen();
    initLoadMore();
    initSearchBar();
    initClassTabs();
});