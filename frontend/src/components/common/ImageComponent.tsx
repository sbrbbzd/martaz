import React, { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '../../utils/imageUrl';
import { getPlaceholder } from '../../utils/placeholderService';

// Import image server config values directly
const imageServerUrl = import.meta.env.VITE_IMAGE_SERVER_URL || 
  `http://${import.meta.env.VITE_IMAGE_SERVER_HOST || 'localhost'}:${import.meta.env.VITE_IMAGE_SERVER_PORT || '3001'}${import.meta.env.VITE_IMAGE_SERVER_PATH || '/api/images'}`;

// Default placeholder image from image server to avoid port issues
const SAFE_PLACEHOLDER = `${imageServerUrl}/placeholder.jpg`;

interface ImageComponentProps {
  src?: string | null;
  alt: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  original?: boolean;
  fallbackImage?: string;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  silent?: boolean;
  [rest: string]: any;
}

// Default placeholder image path
const DEFAULT_PLACEHOLDER = `${imageServerUrl}/placeholder.jpg`;
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 1500; // 1.5 seconds between retries

// Image Error Registry - Keep track of failed images to avoid repeated failures
const failedImageRegistry = new Set<string>();

// Helper function to process image URLs
const getProcessedImageUrl = (src: string | null, original: boolean = false): string | null => {
  // Skip processing if already known to fail
  if (src && failedImageRegistry.has(src)) {
    return null;
  }
  
  // Handle null or empty source
  if (!src || typeof src !== 'string' || src.trim() === '') {
    return null;
  }
  
  // If original parameter is true, don't process the URL
  if (original) {
    return src;
  }
  
  // Clean the URL if it has quotes or JSON syntax
  let cleanedSrc = src.trim();
  if (cleanedSrc.includes('"') || cleanedSrc.includes("'") || cleanedSrc.includes('{') || cleanedSrc.includes('}')) {
    cleanedSrc = cleanedSrc.replace(/['"{}]/g, '');
  }
  
  // Handle absolute URLs
  if (cleanedSrc.startsWith('http://') || cleanedSrc.startsWith('https://')) {
    // If URL is from Vite dev server, redirect to image server
    if (cleanedSrc.includes(':5173')) {
      const filename = cleanedSrc.split('/').pop();
      if (filename) {
        return `${imageServerUrl}/${filename}`;
      }
    }
    return cleanedSrc;
  }
  
  // Handle /api/images/ paths
  if (cleanedSrc.startsWith('/api/images/')) {
    const filename = cleanedSrc.substring('/api/images/'.length);
    return `${imageServerUrl}/${filename}`;
  }
  
  // Handle UUID-style paths
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.[a-z]+)?$/i;
  if (uuidPattern.test(cleanedSrc) || (cleanedSrc.includes('/') && uuidPattern.test(cleanedSrc.split('/').pop() || ''))) {
    const filename = cleanedSrc.split('/').pop();
    return `${imageServerUrl}/${filename}`;
  }
  
  // Handle relative paths
  if (cleanedSrc.startsWith('/')) {
    cleanedSrc = cleanedSrc.substring(1);
  }
  
  // Default case - combine with image server URL
  return `${imageServerUrl}/${cleanedSrc}`;
};

/**
 * A component for safely displaying images with error handling
 */
const ImageComponent: React.FC<ImageComponentProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  original = false,
  fallbackImage = DEFAULT_PLACEHOLDER,
  onLoad,
  onError,
  silent = false,
  ...rest
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const processedRef = useRef<boolean>(false);
  const srcRef = useRef<string | null | undefined>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  
  // Cleanup function for timeouts
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    // Skip if this is the same source we already processed
    if (srcRef.current === src && processedRef.current) {
      return;
    }
    
    srcRef.current = src;
    
    // Reset states when src changes
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
    
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    try {
      // Process the source URL
      const processedSrc = src ? getProcessedImageUrl(src, original) : null;
      
      if (!processedSrc) {
        // If we couldn't get a valid source, set error state immediately
        setIsLoading(false);
        setHasError(true);
        return;
      }
      
      setImgSrc(processedSrc);
      processedRef.current = true;
    } catch (error) {
      setIsLoading(false);
      setHasError(true);
    }
  }, [src, original]);
  
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (onLoad) onLoad();
    
    // Clear retry count on successful load
    setRetryCount(0);
    
    // Remove from failed registry if it was there
    if (src && failedImageRegistry.has(src)) {
      failedImageRegistry.delete(src);
    }
  };
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Only retry if we haven't exceeded max retries
    if (retryCount < MAX_RETRY_COUNT) {
      setRetryCount(prev => prev + 1);
      
      // Set up retry with exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      retryTimeoutRef.current = window.setTimeout(() => {
        // Force a re-render with a new timestamp to bypass browser cache
        const timestamp = new Date().getTime();
        const retryUrl = imgSrc?.includes('?') 
          ? `${imgSrc}&retry=${timestamp}` 
          : `${imgSrc}?retry=${timestamp}`;
        setImgSrc(retryUrl);
      }, delay);
      
      return;
    }
    
    // If we've exhausted retries, handle the error
    if (src) {
      failedImageRegistry.add(src);
    }
    
    // Only log errors if not in silent mode
    if (!silent && import.meta.env.DEV) {
      console.error(`Error loading image after ${MAX_RETRY_COUNT} retries:`, {
        originalSrc: src,
        processedSrc: imgSrc,
        error: e.type
      });
    }
    
    setIsLoading(false);
    setHasError(true);
    if (onError) onError(e);
  };
  
  // Determine the final source to display
  const displaySrc = hasError || !imgSrc ? fallbackImage : imgSrc;
  
  return (
    <>
      {isLoading && <div className={`image-skeleton ${className}`} style={{ width, height }} />}
      <img
        src={displaySrc}
        alt={alt}
        className={`${className} ${isLoading ? 'image-loading' : ''} ${hasError ? 'image-error' : ''}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        width={width}
        height={height}
        {...rest}
      />
    </>
  );
};

export default ImageComponent; 