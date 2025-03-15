/**
 * Date utility functions for formatting and handling dates
 */

/**
 * Format date based on specified format
 * @param date Date to format
 * @param format Format style - 'full' | 'long' | 'medium' | 'short'
 * @param locale Locale to use for formatting (default: browser locale)
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date, 
  format: 'full' | 'long' | 'medium' | 'short' = 'medium',
  locale?: string
): string => {
  const options: Intl.DateTimeFormatOptions = {};
  
  switch (format) {
    case 'full':
      options.weekday = 'long';
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      break;
    case 'long':
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      break;
    case 'medium':
      options.year = 'numeric';
      options.month = 'short';
      options.day = 'numeric';
      break;
    case 'short':
      options.year = '2-digit';
      options.month = 'numeric';
      options.day = 'numeric';
      break;
  }
  
  return new Intl.DateTimeFormat(locale, options).format(date);
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
 * Get a relative time string (e.g., "5 minutes ago")
 * @param date Date to calculate time since
 * @param locale Locale to use for formatting (default: browser locale)
 * @returns Relative time string
 */
export const timeSince = (date: Date, locale?: string): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  if (diffSecs < 60) {
    return rtf.format(-diffSecs, 'second');
  } else if (diffMins < 60) {
    return rtf.format(-diffMins, 'minute');
  } else if (diffHours < 24) {
    return rtf.format(-diffHours, 'hour');
  } else if (diffDays < 30) {
    return rtf.format(-diffDays, 'day');
  } else {
    // Fall back to formatted date for older dates
    return formatDate(date, 'medium', locale);
  }
};

/**
 * Format a date range
 * @param startDate Start date
 * @param endDate End date
 * @param locale Locale to use for formatting (default: browser locale)
 * @returns Formatted date range string
 */
export const formatDateRange = (
  startDate: Date,
  endDate: Date,
  locale?: string
): string => {
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