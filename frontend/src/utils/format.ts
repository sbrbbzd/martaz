/**
 * Utility functions for formatting values
 */

/**
 * Format a number as currency
 * @param value - The numeric value to format
 * @param currency - The currency code or symbol (default: ₼)
 * @param locale - The locale to use for formatting (default: az-AZ)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number, 
  currency: string = '₼', 
  locale: string = 'az-AZ'
): string => {
  // Replace AZN with the manat symbol
  if (currency === 'AZN') {
    return `₼ ${value.toLocaleString(locale)}`;
  }
  
  // If it's one of the other standard currency codes, use the built-in formatter
  if (['USD', 'EUR'].includes(currency)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }
  
  // Otherwise, use the symbol directly
  return `${currency} ${value.toLocaleString(locale)}`;
}; 