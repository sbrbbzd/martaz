/**
 * API utility functions
 */

export const API_BASE_URL: string;
export const IMAGE_SERVER_URL: string;

/**
 * Get a properly formatted image URL that works across environments
 * @param imagePath - The image path or filename
 * @returns The properly formatted URL
 */
export function getImageUrl(imagePath: string | undefined): string; 