// Core modules - always loaded
import { loadHeaderFooter } from './modules/loadHeaderFooter.js';
import { initCursorEffect } from './modules/cursor.js';
import { initLoadingScreen } from './modules/loadingScreen.js';
import { initSearchBar } from './modules/searchBar.js';
import { initLastModified } from './modules/lastModified.js';

// Secure dynamic loading
import { moduleLoader, loadModulesForCurrentPage } from './modules/secureModuleLoader.js';

/**
 * Simple application initialization - loads only what's needed
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize core functionality
        await initCoreModules();
        
        // Load only the modules needed for current page
        await loadModulesForCurrentPage();
        
    } catch (error) {
        // Graceful fallback
        initBasicFallback();
    }
});

/**
 * Initialize core modules needed on every page
 */
async function initCoreModules() {
    // Load header/footer first
    loadHeaderFooter(() => {
        initLastModified();
    });

    // Initialize essential UI
    initCursorEffect();
    initLoadingScreen();
    initSearchBar('#search', '[data-searchable]');
}

/**
 * Basic fallback if dynamic loading fails
 */
function initBasicFallback() {
    // Only core functionality
    loadHeaderFooter(() => {
        initLastModified();
    });
    
    initCursorEffect();
    initLoadingScreen();
    initSearchBar('#search', '[data-searchable]');
}