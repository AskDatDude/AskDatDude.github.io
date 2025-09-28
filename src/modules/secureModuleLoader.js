/**
 * Simple Dynamic Module Loader
 * Lightweight, loads only what's needed on-demand
 */

class SimpleModuleLoader {
    constructor() {
        this.cache = new Map();
        this.loading = new Set();
    }

    /**
     * Load a module only when needed
     */
    async loadModule(modulePath) {
        // Return cached module if available
        if (this.cache.has(modulePath)) {
            return this.cache.get(modulePath);
        }

        // Prevent duplicate loading
        if (this.loading.has(modulePath)) {
            // Wait for the module to finish loading
            return new Promise((resolve) => {
                const checkLoading = () => {
                    if (this.cache.has(modulePath)) {
                        resolve(this.cache.get(modulePath));
                    } else {
                        setTimeout(checkLoading, 10);
                    }
                };
                checkLoading();
            });
        }

        this.loading.add(modulePath);

        try {
            const module = await import(modulePath);
            this.cache.set(modulePath, module);
            this.loading.delete(modulePath);
            return module;
        } catch (error) {
            this.loading.delete(modulePath);
            console.warn(`Failed to load module: ${modulePath}`);
            return null;
        }
    }

    /**
     * Initialize a module function safely
     */
    async initializeModule(modulePath, functionName, ...args) {
        try {
            const module = await this.loadModule(modulePath);
            if (module && typeof module[functionName] === 'function') {
                return await module[functionName](...args);
            }
        } catch (error) {
            console.warn(`Failed to initialize ${functionName} from ${modulePath}`);
        }
    }
}

// Export singleton
export const moduleLoader = new SimpleModuleLoader();

/**
 * Smart module loading based on what's actually on the page
 */
export async function loadModulesForCurrentPage() {
    const currentPath = window.location.pathname;
    
    // Check what elements are actually present on the page
    const moduleChecks = [
        // Home page elements
        { selector: '#technologies-tools, #coding-languages', module: '/src/modules/renderTechnologies.js', func: 'renderTechnologies' },
        { selector: '#projects-grid', module: '/src/modules/renderProjects.js', func: 'renderProjects' },
        { selector: '#radar-chart', module: '/src/modules/radarChart.js', func: 'initRadarChart', needsData: true },
        
        // Diary elements
        { selector: '#diary-cards', module: '/src/modules/renderDiaryCards.js', func: 'renderDiaryCards' },
        { selector: '.diary-entry', module: '/src/modules/diaryViewer.js' }, // Special handling
        { selector: '.week-entry', module: '/src/modules/renderWeek.js', func: 'renderWeek' },
        
        // Toolbox elements
        { selector: '#toolbox-cards', module: '/src/modules/renderToolboxCards.js', func: 'renderToolboxCards' },
        { selector: '#qr-container', module: '/src/modules/qrGenerator.js', func: 'initQRGenerator' },
        { selector: '#image-converter-container', module: '/src/modules/imageConverter.js', func: 'initImageConverter' },
        
        // Date elements
        { selector: '#json-update-date, #json-update-date2', module: '/src/modules/updateDate.js', func: 'updateJsonDate' }
    ];

    // Load only the modules we actually need
    for (const check of moduleChecks) {
        const element = document.querySelector(check.selector);
        if (element) {
            if (check.func) {
                // Handle radar chart special case
                if (check.needsData) {
                    const radarDataModule = await moduleLoader.loadModule('/src/modules/radarChartData.js');
                    if (radarDataModule?.radarChartData) {
                        await moduleLoader.initializeModule(check.module, check.func, check.selector, radarDataModule.radarChartData);
                    }
                } else {
                    await moduleLoader.initializeModule(check.module, check.func, check.selector);
                }
            }
        }
    }

    // Handle special cases
    await handleSpecialCases(currentPath);
}

/**
 * Handle special cases and URL parameters
 */
async function handleSpecialCases(currentPath) {
    // Handle diary entry from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const entryFilename = urlParams.get('entry');
    
    if (entryFilename && document.querySelector('.diary-entry')) {
        await moduleLoader.initializeModule('/src/modules/diaryViewer.js', 'renderDiaryEntry', entryFilename);
    }
    
    // Handle date updates if elements exist
    if (document.querySelector('#json-update-date, #json-update-date2')) {
        const updateModule = await moduleLoader.loadModule('/src/modules/updateDate.js');
        if (updateModule?.updateJsonDate) updateModule.updateJsonDate();
        if (updateModule?.updateToolboxCount) updateModule.updateToolboxCount();
    }
}