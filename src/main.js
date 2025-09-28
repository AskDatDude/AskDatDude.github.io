import { loadHeaderFooter } from './modules/loadHeaderFooter.js';
import { initCursorEffect } from './modules/cursor.js';
import { initLoadingScreen } from './modules/loadingScreen.js';
import { initSearchBar } from './modules/searchBar.js';
import { initLastModified } from './modules/lastModified.js';
import { renderDiaryEntry } from './modules/diaryViewer.js';
import { updateJsonDate, updateToolboxCount } from './modules/updateDate.js';
import { renderDiaryCards } from './modules/renderDiaryCards.js';
import { renderToolboxCards } from './modules/renderToolboxCards.js';
import { renderTechnologies } from './modules/renderTechnologies.js';
import { renderProjects } from './modules/renderProjects.js';
import { initClassTabs } from './modules/classTabs.js';
import { renderWeek } from './modules/renderWeek.js';
import { initRadarChart } from './modules/radarChart.js';
import { radarChartData } from './modules/radarChartData.js';
import { initQRGenerator } from './modules/qrGenerator.js';

document.addEventListener('DOMContentLoaded', () => {
    loadHeaderFooter(() => {
        initLastModified();
    });

    renderProjects();
    initCursorEffect();
    initLoadingScreen();
    initSearchBar('#search', '[data-searchable]');
    initClassTabs(); // Ensure this function is called
    updateJsonDate();
    updateToolboxCount();
    renderDiaryCards();
    renderToolboxCards();
    renderTechnologies();
    
    // Initialize radar chart if container exists
    const radarContainer = document.querySelector('#radar-chart');
    if (radarContainer) {
        initRadarChart('#radar-chart', radarChartData);
    }
    
    // Initialize QR generator if container exists
    const qrContainer = document.querySelector('#qr-container');
    if (qrContainer) {
        initQRGenerator();
    }
    
    // Check if the current page is diary.html and extract parameters
    const urlParams = new URLSearchParams(window.location.search);
    const entryFilename = urlParams.get('entry');
    
    if (entryFilename) {
        renderDiaryEntry(`${entryFilename}`);
    }
    
    // Handle week display from URL parameter (for diary entries)
    if (window.location.pathname.includes('/diary/entries/diary.html')) {
        renderWeek('.week-entry'); // Pass the selector for the week entry
    }
});