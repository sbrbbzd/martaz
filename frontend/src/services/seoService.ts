import { fetchWithAuth } from '../utils/fetchWithAuth';

export interface SeoSettings {
  id: string;
  pageType: string;
  pageIdentifier: string | null;
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  canonical: string | null;
  robotsDirectives: string | null;
  structuredData: Record<string, any> | null;
  priority: number;
}

interface SeoOptions {
  pageType: string;
  pageIdentifier?: string | null;
  fallback?: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
}

/**
 * Fetches SEO settings for a specific page
 */
export const fetchSeoSettings = async (options: SeoOptions): Promise<SeoSettings | null> => {
  try {
    const { pageType, pageIdentifier } = options;
    const queryParams = new URLSearchParams();
    
    queryParams.append('pageType', pageType);
    if (pageIdentifier) {
      queryParams.append('pageIdentifier', pageIdentifier);
    }
    
    console.log(`Fetching SEO settings for pageType=${pageType}${pageIdentifier ? `, pageIdentifier=${pageIdentifier}` : ''}`);
    
    const response = await fetchWithAuth(`/seo/by-page?${queryParams.toString()}`);
    
    if (response.success && response.data) {
      console.log(`Successfully fetched SEO settings for ${pageType}`, response.data);
      return response.data;
    }
    
    console.warn(`No SEO settings found for pageType=${pageType}${pageIdentifier ? `, pageIdentifier=${pageIdentifier}` : ''}`, 
      response?.message || 'No data returned');
    return null;
  } catch (error) {
    console.error(`Error fetching SEO settings for pageType=${options.pageType}:`, error);
    return null;
  }
};

/**
 * Applies SEO settings to the document head
 */
export const applySeoSettings = (settings: SeoSettings | null, options: SeoOptions): void => {
  console.log('Applying SEO settings:', settings ? 'Settings found' : 'Using fallbacks');
  
  // Use fallback values if settings are null
  const fallback = options.fallback || {};
  
  // Set basic meta tags
  document.title = settings?.title || fallback.title || 'Mart.az';
  console.log('Setting document title to:', document.title);
  
  // Function to create or update a meta tag
  const setMetaTag = (name: string, content: string | null) => {
    if (!content) return;
    
    let metaTag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = name;
      document.head.appendChild(metaTag);
      console.log(`Created new meta tag: ${name}=${content}`);
    } else {
      console.log(`Updated existing meta tag: ${name}=${content}`);
    }
    metaTag.content = content;
  };
  
  // Function to create or update an Open Graph meta tag
  const setOgMetaTag = (property: string, content: string | null) => {
    if (!content) return;
    
    let metaTag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('property', property);
      document.head.appendChild(metaTag);
      console.log(`Created new OG meta tag: ${property}=${content}`);
    } else {
      console.log(`Updated existing OG meta tag: ${property}=${content}`);
    }
    metaTag.content = content;
  };
  
  // Set standard meta tags
  setMetaTag('description', settings?.description || fallback.description || '');
  setMetaTag('keywords', settings?.keywords || '');
  
  // Set Open Graph meta tags
  setOgMetaTag('og:title', settings?.ogTitle || settings?.title || fallback.title || '');
  setOgMetaTag('og:description', settings?.ogDescription || settings?.description || fallback.description || '');
  setOgMetaTag('og:image', settings?.ogImage || fallback.ogImage || '');
  
  // Set Twitter Card meta tags
  setMetaTag('twitter:title', settings?.twitterTitle || settings?.ogTitle || settings?.title || fallback.title || '');
  setMetaTag('twitter:description', settings?.twitterDescription || settings?.ogDescription || settings?.description || fallback.description || '');
  setMetaTag('twitter:image', settings?.twitterImage || settings?.ogImage || fallback.ogImage || '');
  setMetaTag('twitter:card', 'summary_large_image');
  
  // Set canonical link
  if (settings?.canonical) {
    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
      console.log(`Created canonical link: ${settings.canonical}`);
    } else {
      console.log(`Updated canonical link: ${settings.canonical}`);
    }
    canonicalTag.href = settings.canonical;
  }
  
  // Set robots directives
  if (settings?.robotsDirectives) {
    setMetaTag('robots', settings.robotsDirectives);
  }
  
  // Add structured data if available
  if (settings?.structuredData) {
    // Remove existing structured data script if any
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
      console.log('Removed existing structured data script');
    }
    
    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(settings.structuredData);
    document.head.appendChild(script);
    console.log('Added structured data script:', settings.structuredData['@type'] || 'Unknown type');
  }
};

/**
 * Hook to use in React components for applying SEO settings
 * This is designed to be used directly inside a useEffect
 */
export const useSeoSettings = async (options: SeoOptions): Promise<void> => {
  try {
    console.log(`Fetching SEO settings for ${options.pageType} page`);
    const settings = await fetchSeoSettings(options);
    applySeoSettings(settings, options);
    return Promise.resolve();
  } catch (error) {
    console.error('Error in useSeoSettings:', error);
    // Apply fallback settings even if there was an error
    applySeoSettings(null, options);
    return Promise.resolve();
  }
};

/**
 * Helper to create a combined SEO hook for a specific page type
 * This is designed to be used directly inside a useEffect
 */
export const createSeoHook = (pageType: string) => {
  return async (pageIdentifier?: string, fallback?: SeoOptions['fallback']): Promise<void> => {
    try {
      console.log(`Using SEO hook for ${pageType}${pageIdentifier ? ` with identifier ${pageIdentifier}` : ''}`);
      
      await useSeoSettings({
        pageType,
        pageIdentifier,
        fallback
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error(`Error in ${pageType} SEO hook:`, error);
      return Promise.resolve();
    }
  };
};

// Create pre-configured hooks for common page types
export const useHomeSeo = createSeoHook('home');
export const useListingsSeo = createSeoHook('listings');
export const useListingDetailSeo = createSeoHook('listing_detail');
export const useCategorySeo = createSeoHook('category');
export const useUserProfileSeo = createSeoHook('user_profile');
export const useSearchSeo = createSeoHook('search');
export const useStaticPageSeo = createSeoHook('static'); 