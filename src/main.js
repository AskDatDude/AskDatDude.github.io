// Core modules - always loaded
import { loadHeaderFooter } from './modules/loadHeaderFooter.js';
import { initCursorEffect } from './modules/cursor.js';
import { initLoadingScreen } from './modules/loadingScreen.js';
import { initSearchBar } from './modules/searchBar.js';
import { initLastModified } from './modules/lastModified.js';

// Secure dynamic loading
import { moduleLoader, getModulesForPage } from './modules/secureModuleLoader.js';
import { initPreloading } from './modules/simplePreloader.js';

/**
 * Dynamic application initialization - fully automatic and self-adapting
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize core functionality
        await initCoreModules();
        
        // Load page-specific modules
        await loadPageModules();
        
        // Initialize comprehensive preloading
        initPreloading();
        
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
 * Load modules specific to current page
 */
async function loadPageModules() {
    const currentPath = window.location.pathname;
    const requiredModules = getModulesForPage(currentPath);
    
    if (requiredModules.length > 0) {
        await moduleLoader.loadModules(requiredModules);
        await initializePageFunctionality(currentPath);
    }
}

/**
 * Initialize page functionality based on current page
 * Fully dynamic - automatically adapts to new pages
 */
async function initializePageFunctionality(currentPath) {
    try {
        // Home page
        if (currentPath === '/' || currentPath === '/index.html') {
            await initHomePage();
        }
        // Diary pages
        else if (currentPath.includes('/diary/')) {
            await initDiaryPage();
        }
        // Toolbox pages
        else if (currentPath.includes('/toolbox/')) {
            await initToolboxPage();
        }
        // School pages
        else if (currentPath.includes('/school/')) {
            await initSchoolPage();
        }
        // Projects pages
        else if (currentPath.includes('/projects/')) {
            await initProjectPage();
        }
        // Generic page handler for new pages
        else {
            await initGenericPage();
        }
    } catch (error) {
        // Silent failure - don't break the page
    }
}

/**
 * Initialize home page modules
 */
async function initHomePage() {
    await moduleLoader.initializeModule('/src/modules/renderTechnologies.js', 'renderTechnologies');
    await moduleLoader.initializeModule('/src/modules/renderProjects.js', 'renderProjects');
    
    // Handle date updates
    const updateModule = await moduleLoader.loadModule('/src/modules/updateDate.js');
    if (updateModule.updateJsonDate) updateModule.updateJsonDate();
    if (updateModule.updateToolboxCount) updateModule.updateToolboxCount();
    
    // Initialize radar chart if container exists
    const radarContainer = document.querySelector('#radar-chart');
    if (radarContainer) {
        const radarChartModule = await moduleLoader.loadModule('/src/modules/radarChart.js');
        const radarDataModule = await moduleLoader.loadModule('/src/modules/radarChartData.js');
        
        if (radarChartModule.initRadarChart && radarDataModule.radarChartData) {
            radarChartModule.initRadarChart('#radar-chart', radarDataModule.radarChartData);
        }
    }
}

/**
 * Initialize diary page
 */
async function initDiaryPage() {
    const diaryContainer = document.querySelector('#diary-cards');
    if (diaryContainer) {
        await moduleLoader.initializeModule('/src/modules/renderDiaryCards.js', 'renderDiaryCards');
    }
    
    // Handle diary entry from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const entryFilename = urlParams.get('entry');
    
    if (entryFilename) {
        await moduleLoader.initializeModule('/src/modules/diaryViewer.js', 'renderDiaryEntry', entryFilename);
    }
    
    // Handle week display
    if (window.location.pathname.includes('/diary/entries/diary.html')) {
        await moduleLoader.initializeModule('/src/modules/renderWeek.js', 'renderWeek', '.week-entry');
    }
}

/**
 * Initialize toolbox page
 */
async function initToolboxPage() {
    const toolboxContainer = document.querySelector('#toolbox-cards');
    if (toolboxContainer) {
        await moduleLoader.initializeModule('/src/modules/renderToolboxCards.js', 'renderToolboxCards');
    }
    
    // Initialize QR generator if container exists
    const qrContainer = document.querySelector('#qr-container');
    if (qrContainer) {
        await moduleLoader.initializeModule('/src/modules/qrGenerator.js', 'initQRGenerator');
    }
}

/**
 * Initialize school page
 */
async function initSchoolPage() {
    const tabsContainer = document.querySelector('.class-tabs') || document.querySelector('[data-tab]');
    if (tabsContainer) {
        await moduleLoader.initializeModule('/src/modules/classTabs.js', 'initClassTabs');
    }
}

/**
 * Initialize project page
 */
async function initProjectPage() {
    const tabsContainer = document.querySelector('.class-tabs') || document.querySelector('[data-tab]');
    if (tabsContainer) {
        await moduleLoader.initializeModule('/src/modules/classTabs.js', 'initClassTabs');
    }
}

/**
 * Generic page initializer for new pages
 * Automatically detects common elements and initializes appropriate modules
 */
async function initGenericPage() {
    // Auto-detect and initialize common elements
    const detectionRules = [
        // Technology cards
        { selector: '#technologies-tools, #coding-languages', module: '/src/modules/renderTechnologies.js', func: 'renderTechnologies' },
        // Project cards
        { selector: '#projects-grid', module: '/src/modules/renderProjects.js', func: 'renderProjects' },
        // Diary elements
        { selector: '#diary-cards', module: '/src/modules/renderDiaryCards.js', func: 'renderDiaryCards' },
        // Toolbox elements
        { selector: '#toolbox-cards', module: '/src/modules/renderToolboxCards.js', func: 'renderToolboxCards' },
        // QR generator
        { selector: '#qr-container', module: '/src/modules/qrGenerator.js', func: 'initQRGenerator' },
        // Class tabs
        { selector: '.class-tabs, [data-tab]', module: '/src/modules/classTabs.js', func: 'initClassTabs' },
        // Radar chart
        { selector: '#radar-chart', module: '/src/modules/radarChart.js', func: 'initRadarChart' }
    ];

    for (const rule of detectionRules) {
        const element = document.querySelector(rule.selector);
        if (element) {
            try {
                // Add module to available modules if not already there
                moduleLoader.addAvailableModule(rule.module);
                await moduleLoader.initializeModule(rule.module, rule.func);
            } catch (error) {
                // Silent failure for individual modules
            }
        }
    }

    // Handle special cases
    await handleSpecialElements();
}

/**
 * Handle special elements and URL parameters
 */
async function handleSpecialElements() {
    // Handle URL parameters for diary entries
    const urlParams = new URLSearchParams(window.location.search);
    const entryFilename = urlParams.get('entry');
    
    if (entryFilename) {
        moduleLoader.addAvailableModule('/src/modules/diaryViewer.js');
        await moduleLoader.initializeModule('/src/modules/diaryViewer.js', 'renderDiaryEntry', entryFilename);
    }
    
    // Handle week display
    if (window.location.pathname.includes('/diary/entries/diary.html') || document.querySelector('.week-entry')) {
        moduleLoader.addAvailableModule('/src/modules/renderWeek.js');
        await moduleLoader.initializeModule('/src/modules/renderWeek.js', 'renderWeek', '.week-entry');
    }
    
    // Handle date updates if elements exist
    if (document.querySelector('#json-update-date, #json-update-date2')) {
        moduleLoader.addAvailableModule('/src/modules/updateDate.js');
        const updateModule = await moduleLoader.loadModule('/src/modules/updateDate.js');
        if (updateModule.updateJsonDate) updateModule.updateJsonDate();
        if (updateModule.updateToolboxCount) updateModule.updateToolboxCount();
    }
    
    // Handle radar chart with data
    const radarContainer = document.querySelector('#radar-chart');
    if (radarContainer) {
        moduleLoader.addAvailableModule('/src/modules/radarChart.js');
        moduleLoader.addAvailableModule('/src/modules/radarChartData.js');
        
        const radarChartModule = await moduleLoader.loadModule('/src/modules/radarChart.js');
        const radarDataModule = await moduleLoader.loadModule('/src/modules/radarChartData.js');
        
        if (radarChartModule.initRadarChart && radarDataModule.radarChartData) {
            radarChartModule.initRadarChart('#radar-chart', radarDataModule.radarChartData);
        }
    }
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