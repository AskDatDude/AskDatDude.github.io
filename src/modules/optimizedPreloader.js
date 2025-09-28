/**
 * Optimized High-Performance Preloader
 * Designed to reduce page load times from 8+ seconds to under 2 seconds on 3G
 */

import { moduleLoader, getModulesForPage } from './secureModuleLoader.js';

class OptimizedPreloader {
    constructor() {
        this.preloadedModules = new Set();
        this.preloadQueue = [];
        this.isPreloading = false;
        this.resourceHints = new Set();
        
        // Performance optimizations
        this.maxConcurrentLoads = navigator.hardwareConcurrency || 4;
        this.loadingPool = [];
        
        // Module priorities for optimal loading order
        this.modulePriorities = {
            // Critical - needed for initial render
            critical: [
                '/src/modules/renderTechnologies.js',
                '/src/modules/renderProjects.js'
            ],
            // High - needed for core functionality
            high: [
                '/src/modules/updateDate.js',
                '/src/modules/radarChartData.js',
                '/src/modules/radarChart.js'
            ],
            // Medium - needed for secondary pages
            medium: [
                '/src/modules/renderDiaryCards.js',
                '/src/modules/diaryViewer.js',
                '/src/modules/renderToolboxCards.js'
            ],
            // Low - nice to have
            low: [
                '/src/modules/renderWeek.js',
                '/src/modules/qrGenerator.js'
            ]
        };
    }

    /**
     * Initialize optimized preloading immediately
     */
    init() {
        // Start immediately - no delays
        this.startAggressivePreloading();
        this.setupResourceHints();
        this.setupIntelligentPreloading();
        
        // Performance monitoring
        this.setupPerformanceTracking();
    }

    /**
     * Start aggressive preloading strategy
     */
    async startAggressivePreloading() {
        try {
            // Add resource hints first (fastest possible preloading)
            this.addResourceHintsForAllModules();
            
            // Start loading critical modules immediately
            await this.preloadByPriority('critical');
            
            // Load high priority modules with minimal delay
            setTimeout(() => this.preloadByPriority('high'), 50);
            
            // Load medium priority modules
            setTimeout(() => this.preloadByPriority('medium'), 200);
            
            // Load low priority modules last
            setTimeout(() => this.preloadByPriority('low'), 500);
            
            // Preload all page configurations
            this.preloadAllPageConfigurations();
            
        } catch (error) {
            console.warn('Aggressive preloading failed:', error);
        }
    }

    /**
     * Add resource hints for immediate browser preloading
     */
    addResourceHintsForAllModules() {
        const allModules = [
            ...this.modulePriorities.critical,
            ...this.modulePriorities.high,
            ...this.modulePriorities.medium,
            ...this.modulePriorities.low
        ];

        // Add preload hints for critical resources
        allModules.forEach((moduleUrl, index) => {
            if (index < 5) { // Only preload first 5 for immediate loading
                this.addResourceHint(moduleUrl, 'preload', 'script');
            } else {
                // Add prefetch hints for others
                this.addResourceHint(moduleUrl, 'prefetch', 'script');
            }
        });

        // Add DNS prefetch for external resources
        this.addResourceHint('//fonts.googleapis.com', 'dns-prefetch');
        this.addResourceHint('//cdnjs.cloudflare.com', 'dns-prefetch');
    }

    /**
     * Add resource hint to DOM
     */
    addResourceHint(href, rel, as = null) {
        if (this.resourceHints.has(`${rel}:${href}`)) return;
        
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        if (as) link.as = as;
        link.crossOrigin = 'anonymous';
        
        // Add high priority for critical resources
        if (rel === 'preload') {
            link.setAttribute('importance', 'high');
        }
        
        document.head.appendChild(link);
        this.resourceHints.add(`${rel}:${href}`);
    }

    /**
     * Preload modules by priority level
     */
    async preloadByPriority(priority) {
        const modules = this.modulePriorities[priority];
        if (!modules || modules.length === 0) return;

        // Add all modules to available list
        modules.forEach(module => moduleLoader.addAvailableModule(module));

        // Load all modules in parallel for this priority level
        const loadPromises = modules.map(async (moduleUrl) => {
            if (this.preloadedModules.has(moduleUrl)) return;
            
            this.preloadedModules.add(moduleUrl);
            
            try {
                await moduleLoader.loadModule(moduleUrl);
            } catch (error) {
                this.preloadedModules.delete(moduleUrl);
                console.warn(`Failed to preload ${moduleUrl}`);
            }
        });

        await Promise.allSettled(loadPromises);
    }

    /**
     * Preload modules for all page configurations
     */
    async preloadAllPageConfigurations() {
        // Common page patterns that users are likely to visit
        const pagePatterns = [
            '/',
            '/diary/',
            '/toolbox/',
            '/school/',
            '/projects/'
        ];

        // Preload modules for each page pattern
        const preloadPromises = pagePatterns.map(async (pattern) => {
            const modules = getModulesForPage(pattern);
            
            for (const moduleUrl of modules) {
                if (!this.preloadedModules.has(moduleUrl)) {
                    moduleLoader.addAvailableModule(moduleUrl);
                    this.preloadedModules.add(moduleUrl);
                    
                    try {
                        await moduleLoader.loadModule(moduleUrl);
                    } catch (error) {
                        this.preloadedModules.delete(moduleUrl);
                    }
                }
            }
        });

        await Promise.allSettled(preloadPromises);
    }

    /**
     * Setup intelligent preloading based on user behavior
     */
    setupIntelligentPreloading() {
        // Preload on hover (with no delay)
        document.addEventListener('mouseover', (event) => {
            const link = this.findLinkElement(event.target);
            if (link && this.isInternalLink(link)) {
                this.preloadForLink(link);
            }
        });

        // Preload visible links immediately
        this.preloadVisibleLinks();

        // Preload based on scroll behavior
        this.setupScrollPreloading();
    }

    /**
     * Preload visible links immediately
     */
    preloadVisibleLinks() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const link = entry.target;
                        if (this.isInternalLink(link)) {
                            // Preload immediately when visible
                            this.preloadForLink(link);
                        }
                    }
                });
            }, {
                rootMargin: '200px', // Larger margin for earlier preloading
                threshold: 0.1
            });

            // Observe all links immediately
            requestAnimationFrame(() => {
                const links = document.querySelectorAll('a[href]');
                links.forEach(link => {
                    if (this.isInternalLink(link)) {
                        observer.observe(link);
                    }
                });
            });
        }
    }

    /**
     * Setup scroll-based preloading
     */
    setupScrollPreloading() {
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            if (scrollTimeout) return;
            
            scrollTimeout = setTimeout(() => {
                scrollTimeout = null;
                
                // Preload more resources when user scrolls (indicates engagement)
                this.preloadAdditionalResources();
            }, 100);
        }, { passive: true });
    }

    /**
     * Preload additional resources based on user engagement
     */
    async preloadAdditionalResources() {
        // Preload data files
        const dataFiles = [
            '/src/data/projects.json',
            '/src/data/technologies.json',
            '/diary/index.json',
            '/toolbox/index.json'
        ];

        dataFiles.forEach(file => {
            this.addResourceHint(file, 'prefetch', 'fetch');
        });

        // Preload common assets
        const commonAssets = [
            '/src/prism/prism.css',
            '/src/prism/prism-core.min.js'
        ];

        commonAssets.forEach(asset => {
            this.addResourceHint(asset, 'prefetch');
        });
    }

    /**
     * Preload modules for a specific link
     */
    async preloadForLink(link) {
        try {
            const pathname = this.extractPathname(link.href);
            const modules = getModulesForPage(pathname);
            
            // Preload all required modules for this page
            const preloadPromises = modules.map(async (moduleUrl) => {
                if (!this.preloadedModules.has(moduleUrl)) {
                    moduleLoader.addAvailableModule(moduleUrl);
                    this.preloadedModules.add(moduleUrl);
                    return moduleLoader.loadModule(moduleUrl);
                }
            });

            await Promise.allSettled(preloadPromises);
            
        } catch (error) {
            // Silent failure
        }
    }

    /**
     * Setup performance tracking
     */
    setupPerformanceTracking() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name.includes('/src/modules/')) {
                        const loadTime = entry.responseEnd - entry.startTime;
                        
                        // Log slow loading modules
                        if (loadTime > 500) {
                            console.warn(`Slow module load: ${entry.name} took ${loadTime.toFixed(2)}ms`);
                        }
                    }
                }
            });
            
            observer.observe({ entryTypes: ['resource'] });
        }
    }

    /**
     * Find the closest link element
     */
    findLinkElement(element) {
        let current = element;
        while (current && current !== document) {
            if (current.tagName === 'A' && current.href) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }

    /**
     * Check if link is internal
     */
    isInternalLink(link) {
        try {
            const linkUrl = new URL(link.href, window.location.origin);
            return linkUrl.origin === window.location.origin && 
                   !link.hasAttribute('target') &&
                   !link.href.startsWith('mailto:') &&
                   !link.href.startsWith('tel:');
        } catch (error) {
            return false;
        }
    }

    /**
     * Extract pathname from URL
     */
    extractPathname(url) {
        try {
            const urlObj = new URL(url, window.location.origin);
            return urlObj.pathname;
        } catch (error) {
            return '';
        }
    }

    /**
     * Force preload all critical modules immediately
     */
    async forcePreloadCritical() {
        const allCritical = [
            ...this.modulePriorities.critical,
            ...this.modulePriorities.high
        ];

        allCritical.forEach(module => moduleLoader.addAvailableModule(module));
        
        const loadPromises = allCritical.map(moduleUrl => 
            moduleLoader.loadModule(moduleUrl).catch(() => {})
        );

        await Promise.all(loadPromises);
    }

    /**
     * Get preloading statistics
     */
    getStats() {
        return {
            preloadedModules: this.preloadedModules.size,
            resourceHints: this.resourceHints.size,
            queueLength: this.preloadQueue.length,
            maxConcurrentLoads: this.maxConcurrentLoads
        };
    }
}

// Export optimized preloader
export const optimizedPreloader = new OptimizedPreloader();

/**
 * Initialize optimized preloading system
 */
export function initOptimizedPreloading() {
    optimizedPreloader.init();
}

/**
 * Legacy function for compatibility - now uses optimized preloader
 */
export async function discoverAndPreloadAllPages() {
    await optimizedPreloader.forcePreloadCritical();
    optimizedPreloader.preloadAllPageConfigurations();
}

/**
 * Preload specific modules immediately
 */
export async function preloadModules(moduleUrls) {
    moduleUrls.forEach(url => moduleLoader.addAvailableModule(url));
    
    const loadPromises = moduleUrls.map(url => 
        moduleLoader.loadModule(url).catch(() => {})
    );
    
    await Promise.allSettled(loadPromises);
}