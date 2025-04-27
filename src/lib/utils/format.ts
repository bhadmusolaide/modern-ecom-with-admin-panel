/**
 * Utility functions for formatting data
 */

/**
 * Format a number as currency
 * @param amount - The amount to format (in cents)
 * @param currency - The currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  // Convert cents to dollars
  const dollars = amount / 100;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
};

/**
 * Format a date string
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string or fallback text for invalid dates
 */
export const formatDate = (
  dateString: string | undefined | null,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  fallbackText = 'N/A'
): string => {
  // Handle null, undefined, or empty string
  if (!dateString) {
    return fallbackText;
  }

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}`);
      return fallbackText;
    }

    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return fallbackText;
  }
};

/**
 * Format a number with commas
 * @param num - The number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Truncate a string to a specified length
 * @param str - The string to truncate
 * @param length - Maximum length
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated string
 */
export const truncateString = (
  str: string,
  length: number,
  suffix = '...'
): string => {
  if (str.length <= length) {
    return str;
  }

  return str.substring(0, length) + suffix;
};