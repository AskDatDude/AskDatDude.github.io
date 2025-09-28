/**
 * Enhanced Preloader - Comprehensive preloading for all pages
 * Automatically discovers and preloads all internal pages
 */

import { moduleLoader, getModulesForPage, discoverAndPreloadAllPages } from './secureModuleLoader.js';

class EnhancedPreloader {
    constructor() {
        this.preloadedPages = new Set();
        this.hoverTimeout = null;
        this.hoverDelay = 200;
        this.allPagesDiscovered = false;
    }

    /**
     * Initialize comprehensive preloading system
     */
    init() {
        this.setupHoverListeners();
        this.setupIntersectionObserver();
        this.preloadAllPages();
    }

    /**
     * Discover and preload all pages automatically
     */
    async preloadAllPages() {
        if (this.allPagesDiscovered) return;
        
        // Wait a bit after page load to avoid blocking initial render
        setTimeout(async () => {
            try {
                // Use the dynamic discovery system
                await discoverAndPreloadAllPages();
                
                // Also discover pages from existing links on current page
                await this.discoverPagesFromLinks();
                
                this.allPagesDiscovered = true;
            } catch (error) {
                // Silent failure
            }
        }, 3000);
    }

    /**
     * Discover pages from links on current page
     */
    async discoverPagesFromLinks() {
        const links = document.querySelectorAll('a[href]');
        const discoveredPaths = new Set();
        
        links.forEach(link => {
            if (this.isInternalLink(link)) {
                const pathname = this.extractPathname(link.href);
                if (pathname && !discoveredPaths.has(pathname)) {
                    discoveredPaths.add(pathname);
                }
            }
        });
        
        // Preload modules for discovered pages with staggered timing
        let delay = 4000;
        for (const pathname of discoveredPaths) {
            setTimeout(async () => {
                await this.preloadForPath(pathname);
            }, delay);
            delay += 500; // Stagger each preload by 500ms
        }
    }

    /**
     * Setup intersection observer for visible links
     */
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const link = entry.target;
                        if (this.isInternalLink(link)) {
                            // Preload visible links with lower priority
                            setTimeout(() => {
                                this.preloadForLink(link);
                            }, 1500);
                        }
                    }
                });
            }, {
                rootMargin: '100px',
                threshold: 0.1
            });

            // Observe all links after initial load
            setTimeout(() => {
                const links = document.querySelectorAll('a[href]');
                links.forEach(link => {
                    if (this.isInternalLink(link)) {
                        observer.observe(link);
                    }
                });
            }, 1000);
        }
    }

    /**
     * Preload modules for a specific path
     */
    async preloadForPath(pathname) {
        if (this.preloadedPages.has(pathname)) {
            return;
        }

        this.preloadedPages.add(pathname);
        const modules = getModulesForPage(pathname);
        
        if (modules.length > 0) {
            try {
                await moduleLoader.loadModules(modules);
            } catch (error) {
                // Remove from preloaded set on failure
                this.preloadedPages.delete(pathname);
            }
        }
    }

    /**
     * Setup hover listeners for internal links
     */
    setupHoverListeners() {
        document.addEventListener('mouseover', (event) => {
            const link = this.findLinkElement(event.target);
            if (link && this.isInternalLink(link)) {
                this.handleLinkHover(link);
            }
        });

        document.addEventListener('mouseout', () => {
            if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout);
                this.hoverTimeout = null;
            }
        });
    }

    /**
     * Handle link hover with debouncing
     */
    handleLinkHover(link) {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }

        this.hoverTimeout = setTimeout(() => {
            this.preloadForLink(link);
        }, this.hoverDelay);
    }

    /**
     * Preload modules for a specific link
     */
    async preloadForLink(link) {
        try {
            const pathname = this.extractPathname(link.href);
            
            if (this.preloadedPages.has(pathname)) {
                return; // Already preloaded
            }

            this.preloadedPages.add(pathname);
            const modules = getModulesForPage(pathname);
            
            if (modules.length > 0) {
                // Preload modules silently in background
                await moduleLoader.loadModules(modules);
            }
        } catch (error) {
            // Silent failure - don't expose errors to users
            const pathname = this.extractPathname(link.href);
            this.preloadedPages.delete(pathname);
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
     * Check if link is internal and safe to preload
     */
    isInternalLink(link) {
        try {
            const linkUrl = new URL(link.href, window.location.origin);
            const currentUrl = new URL(window.location.href);
            
            return linkUrl.origin === currentUrl.origin && 
                   !link.hasAttribute('target') &&
                   !link.href.startsWith('mailto:') &&
                   !link.href.startsWith('tel:') &&
                   !link.href.includes('#');
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
}

// Export singleton
export const preloader = new EnhancedPreloader();

/**
 * Initialize preloading system
 */
export function initPreloading() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            preloader.init();
        });
    } else {
        preloader.init();
    }
}