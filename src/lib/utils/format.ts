/**
 * Utility functions for formatting data
 */

/**
 * Format a number as currency
 * @param amount - The amount to format (in cents)
 * @param currency - The currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency = 'NGN'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Convert Firestore timestamp to Date object
 * @param timestamp - Firestore timestamp (ISO string, Date object, or Firestore Timestamp object)
 * @returns Date object or null if invalid
 */
export const convertToDate = (timestamp: any): Date | null => {
  try {
    if (!timestamp) return null;

    // If it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }

    // If it's a Firestore Timestamp object
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return timestamp.toDate();
    }

    // If it's a Firestore Timestamp-like object with seconds
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      return new Date(timestamp.seconds * 1000);
    }

    // Try to parse as ISO string
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp format:', timestamp);
      return null;
    }

    return date;
  } catch (error) {
    console.error('Error converting timestamp to date:', error);
    return null;
  }
};

/**
 * Format a date string
 * @param dateString - ISO date string, Date object, or Firestore timestamp
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string or fallback text for invalid dates
 */
export const formatDate = (
  dateString: string | Date | any | undefined | null,
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
    const date = convertToDate(dateString);

    if (!date || isNaN(date.getTime())) {
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