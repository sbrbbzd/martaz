import React, { useState, useEffect, useRef } from 'react';
import { getImageUrl, markImageAsFailed, getImageServerBaseUrl } from '../../../utils/helpers';
import './styles.scss';

// Cache for loaded images
const IMAGE_CACHE = new Map<string, string>();
const FAILED_IMAGES = new Set<string>();

interface ImageComponentProps {
  src: string;
  alt: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  fallbackImage?: string;
  silent?: boolean;
  original?: boolean;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}

const ImageComponent: React.FC<ImageComponentProps> = ({
  src,
  alt,
  className = '',
  width = 'auto',
  height = 'auto',
  fallbackImage = '/placeholder.jpg',
  silent = false,
  original = false,
  onLoad,
  onError
}) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const mountedRef = useRef<boolean>(true);
  const retryTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRIES = 2;
  const imageServerBaseUrl = getImageServerBaseUrl();

  // Cleanup function
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Diagnostic function to validate image URL
  const validateImageUrl = (url: string): string => {
    try {
      // Parse the URL to check for validity
      const parsedUrl = new URL(url);
      
      // Log useful diagnostic information
      if (!silent) {
        console.log('Image URL validation:', {
          url,
          protocol: parsedUrl.protocol,
          host: parsedUrl.host,
          pathname: parsedUrl.pathname,
          imageServerBaseUrl
        });
      }
      
      // If URL is relative (no protocol), prepend with full image server URL
      if (!url.startsWith('http') && !url.startsWith('/')) {
        return `${imageServerBaseUrl}/${url}`;
      }
      
      // If URL is relative to root (starts with /), prepend with image server base
      if (url.startsWith('/') && !url.startsWith('//')) {
        // Avoid double slashes
        const path = url.startsWith('/') ? url.substring(1) : url;
        return `${imageServerBaseUrl}/${path}`;
      }
      
      return url;
    } catch (error) {
      console.error('Invalid URL format:', url, error);
      // If the URL is invalid, return the original URL
      return url;
    }
  };

  // Process image URL
  useEffect(() => {
    if (!mountedRef.current) return;

    // Reset states when src changes
    setHasError(false);
    setIsLoading(true);
    retryCountRef.current = 0;

    try {
      // Ensure fallbackImage has full URL
      const fallbackWithBase = fallbackImage.startsWith('http') 
        ? fallbackImage 
        : getImageUrl(fallbackImage);
      
      // Process the source URL
      const processedUrl = original ? validateImageUrl(src) : getImageUrl(src, fallbackWithBase);
      
      if (!silent) {
        console.log('Processing image:', {
          original: src,
          processed: processedUrl,
          isOriginal: original,
          component: alt || 'unnamed'
        });
      }

      setImgSrc(processedUrl);
    } catch (error) {
      if (!silent) {
        console.error('Error processing image URL:', {
          error,
          src,
          component: alt || 'unnamed'
        });
      }
      setImgSrc(fallbackImage);
      setHasError(true);
      setIsLoading(false);
    }
  }, [src, fallbackImage, original, silent, alt, imageServerBaseUrl]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!mountedRef.current) return;

    setIsLoading(false);
    setHasError(false);
    retryCountRef.current = 0;

    // Extract image details for better logging
    const img = e.currentTarget;
    if (!silent) {
      console.log('Image loaded successfully:', {
        src: imgSrc,
        component: alt || 'unnamed',
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        currentSrc: img.currentSrc
      });
    }

    if (onLoad) {
      onLoad(e);
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!mountedRef.current) return;

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      window.clearTimeout(retryTimeoutRef.current);
    }

    // Extract image details for better error diagnostics
    const img = e.currentTarget;
    const errorDetail = {
      original: src,
      processed: imgSrc,
      component: alt || 'unnamed',
      error: e.type,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      currentSrc: img.currentSrc
    };

    // Attempt retry if under max retries
    if (retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current += 1;
      
      // Add cache busting parameter
      const timestamp = new Date().getTime();
      const retryUrl = `${imgSrc}${imgSrc.includes('?') ? '&' : '?'}_t=${timestamp}`;
      
      if (!silent) {
        console.warn(`Retrying image load (${retryCountRef.current}/${MAX_RETRIES}):`, {
          ...errorDetail,
          retry: retryUrl
        });
      }

      // Set retry timeout with exponential backoff
      retryTimeoutRef.current = window.setTimeout(() => {
        if (mountedRef.current) {
          setImgSrc(retryUrl);
        }
      }, Math.pow(2, retryCountRef.current) * 500);
      
      return;
    }

    // Max retries reached
    if (!silent) {
      console.error('Image load failed after retries:', errorDetail);
    }

    // Mark the original source as failed
    if (src) {
      markImageAsFailed(src);
    }

    setIsLoading(false);
    setHasError(true);
    
    // Ensure fallback has full URL
    const fallbackWithBase = fallbackImage.startsWith('http') 
      ? fallbackImage 
      : getImageUrl(fallbackImage);
    setImgSrc(fallbackWithBase);

    if (onError) {
      onError(e);
    }
  };

  return (
    <div 
      className={`image-component-wrapper ${className}`} 
      style={{ position: 'relative' }}
    >
      <img
        src={imgSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        style={{
          width,
          height,
          objectFit: 'cover',
          opacity: isLoading ? 0.5 : 1,
          transition: 'opacity 0.2s ease-in-out'
        }}
        crossOrigin="anonymous"
      />
      {isLoading && (
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          Loading...
        </div>
      )}
    </div>
  );
};

export default ImageComponent; 