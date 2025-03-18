/**
 * Date utility functions for formatting and handling dates
 */

/**
 * Format a date as a string
 * @param date - The date to format
 * @param format - The format to use (default: locale)
 * @param locale - The locale to use (default: az-AZ)
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string, 
  format: 'locale' | 'iso' | 'relative' | 'short' = 'locale',
  locale: string = 'az-AZ'
): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'iso') {
    return dateObj.toISOString();
  } else if (format === 'relative') {
    return timeAgo(dateObj);
  } else if (format === 'short') {
    // Return date in dd/mm/yyyy format
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  // For backward compatibility, also change the default locale format
  // to use numeric month instead of month name
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\./g, '/'); // Replace dots with slashes if the locale uses dots
};

/**
 * Format time based on specified format
 * @param date Date to format the time from
 * @param includeSeconds Whether to include seconds
 * @param locale Locale to use for formatting (default: browser locale)
 * @returns Formatted time string
 */
export const formatTime = (
  date: Date,
  includeSeconds: boolean = false,
  locale?: string
): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
  };
  
  if (includeSeconds) {
    options.second = 'numeric';
  }
  
  return new Intl.DateTimeFormat(locale, options).format(date);
};

/**
 * Calculate the time ago from a given date
 * @param date - The date to calculate from
 * @param locale - The locale to use (default: az-AZ)
 * @returns Time ago string
 */
export const timeAgo = (date: Date | string, locale: string = 'az-AZ'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // Define time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  // For recent times (less than a minute)
  if (secondsAgo < 5) {
    return 'just now';
  }
  
  // Find the appropriate interval
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(secondsAgo / seconds);
    
    if (interval >= 1) {
      // Create a relative time formatter
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return rtf.format(-interval, unit as Intl.RelativeTimeFormatUnit);
    }
  }
  
  return 'just now';
};

/**
 * Alias for timeAgo function to maintain backward compatibility
 * @param date - The date to calculate from
 * @param locale - The locale to use (default: az-AZ)
 * @returns Time ago string
 */
export const timeSince = timeAgo;

/**
 * Format a date range
 * @param startDateInput Start date (can be Date object or ISO string)
 * @param endDateInput End date (can be Date object or ISO string)
 * @param locale Locale to use for formatting (default: browser locale)
 * @returns Formatted date range string
 */
export const formatDateRange = (
  startDateInput: Date | string,
  endDateInput: Date | string,
  locale?: string
): string => {
  // Convert strings to Date objects if needed
  const startDate = typeof startDateInput === 'string' ? new Date(startDateInput) : startDateInput;
  const endDate = typeof endDateInput === 'string' ? new Date(endDateInput) : endDateInput;
  
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();
  
  if (sameMonth) {
    const formattedStart = new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(startDate);
    const formattedEnd = new Intl.DateTimeFormat(locale, { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(endDate);
    
    return `${formattedStart}-${formattedEnd}`;
  } else if (sameYear) {
    const formattedStart = new Intl.DateTimeFormat(locale, { 
      day: 'numeric',
      month: 'short'
    }).format(startDate);
    
    const formattedEnd = new Intl.DateTimeFormat(locale, { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(endDate);
    
    return `${formattedStart} - ${formattedEnd}`;
  } else {
    const formattedStart = new Intl.DateTimeFormat(locale, { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(startDate);
    
    const formattedEnd = new Intl.DateTimeFormat(locale, { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(endDate);
    
    return `${formattedStart} - ${formattedEnd}`;
  }
};

/**
 * Format a price with appropriate currency symbol
 * @param price - The price value to format
 * @param currency - The currency code (e.g., 'USD', 'EUR')
 * @returns Formatted price string
 */
export const formatCurrency = (price?: number, currency: string = 'AZN'): string => {
  if (price === undefined) return '0 ₼';
  
  // For AZN, use the manat symbol directly
  if (currency === 'AZN') {
    return `₼ ${price.toLocaleString('az-AZ')}`;
  }
  
  // Use the Intl.NumberFormat API for other currencies
  return new Intl.NumberFormat('az-AZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}; 