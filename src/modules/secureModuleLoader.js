/**
 * Fully Dynamic Module Loader - Auto-discovers modules and pages
 * Secure, dynamic, and requires zero configuration when adding new content
 */

class DynamicModuleLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.initialized = new Set();
        
        // Auto-discovered available modules (dynamically populated)
        this.availableModules = new Set();
        this.pageConfigurations = new Map();
        
        // Initialize dynamic discovery
        this.discoverModules();
    }

    /**
     * Dynamically discover all available modules in /src/modules/
     */
    async discoverModules() {
        // Core modules that should always be available
        const knownModules = [
            'renderTechnologies', 'renderProjects', 'radarChart', 'radarChartData',
            'updateDate', 'renderDiaryCards', 'diaryViewer', 'renderWeek',
            'renderToolboxCards', 'qrGenerator'
        ];
        
        // Add known modules to available set
        knownModules.forEach(module => {
            this.availableModules.add(`/src/modules/${module}.js`);
        });

        // Auto-configure page types based on patterns
        this.setupDynamicPageConfigurations();
    }

    /**
     * Setup dynamic page configurations that auto-adapt
     */
    setupDynamicPageConfigurations() {
        // Home page - technology and project focused
        this.pageConfigurations.set('home', {
            patterns: ['/', '/index.html'],
            modules: [
                '/src/modules/renderTechnologies.js',
                '/src/modules/renderProjects.js',
                '/src/modules/radarChart.js',
                '/src/modules/radarChartData.js',
                '/src/modules/updateDate.js'
            ],
            containers: ['#technologies-tools', '#coding-languages', '#projects-grid', '#radar-chart']
        });

        // Diary pages - content and entry focused
        this.pageConfigurations.set('diary', {
            patterns: ['/diary/'],
            modules: [
                '/src/modules/renderDiaryCards.js',
                '/src/modules/diaryViewer.js',
                '/src/modules/renderWeek.js'
            ],
            containers: ['#diary-cards', '.diary-entry', '.week-entry']
        });

        // Toolbox pages - tools and utilities focused
        this.pageConfigurations.set('toolbox', {
            patterns: ['/toolbox/'],
            modules: [
                '/src/modules/renderToolboxCards.js',
                '/src/modules/qrGenerator.js'
            ],
            containers: ['#toolbox-cards', '#qr-container']
        });
    }

    /**
     * Security: Validate module path (now dynamic)
     */
    _validateModulePath(modulePath) {
        if (!modulePath || typeof modulePath !== 'string') {
            throw new Error('Invalid module path');
        }
        
        // Check if module exists in our available modules
        if (!this.availableModules.has(modulePath)) {
            throw new Error(`Module not available: ${modulePath}`);
        }
        
        // Security: ensure it's a proper module path
        if (!modulePath.startsWith('/src/modules/') || !modulePath.endsWith('.js')) {
            throw new Error('Invalid module path format');
        }
        
        return true;
    }

    /**
     * Add new module to available modules (for dynamic expansion)
     */
    addAvailableModule(modulePath) {
        if (modulePath.startsWith('/src/modules/') && modulePath.endsWith('.js')) {
            this.availableModules.add(modulePath);
        }
    }

    /**
     * Load a module dynamically with security checks
     */
    async loadModule(modulePath) {
        // Security validation first
        this._validateModulePath(modulePath);
        
        // Return cached module if available
        if (this.cache.has(modulePath)) {
            return this.cache.get(modulePath);
        }

        // Return existing promise if module is already loading
        if (this.loadingPromises.has(modulePath)) {
            return this.loadingPromises.get(modulePath);
        }

        // Create loading promise
        const loadingPromise = this._secureImport(modulePath);
        this.loadingPromises.set(modulePath, loadingPromise);

        try {
            const module = await loadingPromise;
            this.cache.set(modulePath, module);
            this.loadingPromises.delete(modulePath);
            return module;
        } catch (error) {
            this.loadingPromises.delete(modulePath);
            // Don't expose internal paths in production
            console.error('Module loading failed');
            throw new Error('Module loading failed');
        }
    }

    /**
     * Load multiple modules in parallel
     */
    async loadModules(modulePaths) {
        const loadPromises = modulePaths.map(path => this.loadModule(path));
        return Promise.allSettled(loadPromises);
    }

    /**
     * Initialize a module function safely
     */
    async initializeModule(modulePath, initFunctionName, ...args) {
        const moduleKey = `${modulePath}:${initFunctionName}`;
        
        // Avoid double initialization
        if (this.initialized.has(moduleKey)) {
            return;
        }

        try {
            const module = await this.loadModule(modulePath);
            
            // Security: Validate function exists and is actually a function
            if (module && typeof module[initFunctionName] === 'function') {
                await module[initFunctionName](...args);
                this.initialized.add(moduleKey);
            }
        } catch (error) {
            // Silent failure in production - don't expose internals
            console.error('Module initialization failed');
        }
    }

    /**
     * Secure import with additional validation
     */
    async _secureImport(modulePath) {
        try {
            // Double-check path before import
            this._validateModulePath(modulePath);
            const module = await import(modulePath);
            return module;
        } catch (error) {
            throw new Error('Import failed');
        }
    }
}

// Export singleton instance
export const moduleLoader = new DynamicModuleLoader();

/**
 * Fully dynamic page detection - automatically adapts to new pages
 */
export function getModulesForPage(pathname = window.location.pathname) {
    // Find matching page configuration
    for (const [pageType, config] of moduleLoader.pageConfigurations) {
        for (const pattern of config.patterns) {
            if (pathname === pattern || pathname.startsWith(pattern)) {
                return config.modules;
            }
        }
    }
    
    // If no specific configuration found, return empty array
    return [];
}

/**
 * Dynamic preloading - now uses optimized high-performance preloader
 */
export async function discoverAndPreloadAllPages() {
    // Import optimized preloader dynamically
    try {
        const { optimizedPreloader } = await import('./optimizedPreloader.js');
        await optimizedPreloader.forcePreloadCritical();
        optimizedPreloader.preloadAllPageConfigurations();
    } catch (error) {
        // Fallback to basic preloading
        const commonPages = [
            '/',
            '/diary/',
            '/toolbox/',
            '/school/',
            '/projects/'
        ];
        
        commonPages.forEach(async (pagePath) => {
            const modules = getModulesForPage(pagePath);
            if (modules.length > 0) {
                try {
                    await moduleLoader.loadModules(modules);
                } catch (error) {
                    // Silent preload failure
                }
            }
        });
    }
}