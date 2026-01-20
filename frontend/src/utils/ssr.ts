/**
 * SSR Helper - Get initial state from server-side rendering
 */

export function getInitialState() {
    // Check if we have server-rendered initial state
    if (typeof window !== 'undefined' && window.__INITIAL_STATE__) {
        const initialState = window.__INITIAL_STATE__;

        // Clean up to avoid memory leaks
        delete window.__INITIAL_STATE__;

        return initialState;
    }

    return null;
}

/**
 * Check if content was server-rendered
 */
export function isServerRendered() {
    if (typeof window === 'undefined') {
        return false;
    }

    const seoContent = document.querySelector('[data-seo-content="true"]');
    return seoContent !== null;
}

/**
 * Clean up server-rendered SEO content after React hydration
 */
export function cleanupSEOContent() {
    if (typeof window === 'undefined') {
        return;
    }

    const seoContent = document.querySelector('[data-seo-content="true"]') as HTMLElement;
    if (seoContent) {
        // Keep it hidden but don't remove it - search engines can still see it
        seoContent.style.display = 'none';
    }
}

/**
 * TypeScript declarations for window object
 */
declare global {
    interface Window {
        __INITIAL_STATE__?: {
            listings?: any[];
            categories?: any[];
            category?: any;
            listing?: any;
        };
    }
}

export { };
