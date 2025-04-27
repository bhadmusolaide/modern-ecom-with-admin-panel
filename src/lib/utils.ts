import { Product } from './types';

export function filterProducts(
  products: Product[],
  filters: {
    category?: string;
    size?: string;
    color?: string;
    price?: string;
    tag?: string;
    search?: string;
    sort?: string;
  }
): Product[] {
  return products.filter((product) => {
    // Category filter
    if (filters.category && !product.category.toLowerCase().includes(filters.category.toLowerCase())) {
      return false;
    }

    // Size filter
    if (filters.size && product.sizes && !product.sizes.some(size => size.toLowerCase() === filters.size?.toLowerCase())) {
      return false;
    }

    // Color filter
    if (filters.color && product.colors && !product.colors.some(color => color.toLowerCase() === filters.color?.toLowerCase())) {
      return false;
    }

    // Price filter
    if (filters.price) {
      const price = product.isSale ? (product.salePrice || 0) : product.price;

      switch (filters.price) {
        case 'under-50':
          if (price >= 50) return false;
          break;
        case '50-100':
          if (price < 50 || price > 100) return false;
          break;
        case '100-150':
          if (price < 100 || price > 150) return false;
          break;
        case '150-200':
          if (price < 150 || price > 200) return false;
          break;
        case 'over-200':
          if (price <= 200) return false;
          break;
      }
    }

    // Tag filter
    if (filters.tag) {
      if (filters.tag === 'new-arrival' && !product.isNew) return false;
      if (filters.tag === 'sale' && !product.isSale) return false;
      if (['sustainable', 'organic', 'recycled'].includes(filters.tag) &&
          (!product.tags || !product.tags.includes(filters.tag))) {
        return false;
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const nameMatch = product.name.toLowerCase().includes(searchLower);
      const categoryMatch = product.category.toLowerCase().includes(searchLower);
      const descriptionMatch = product.description?.toLowerCase().includes(searchLower) || false;
      const tagsMatch = product.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false;

      if (!nameMatch && !categoryMatch && !descriptionMatch && !tagsMatch) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    // Sort products
    if (!filters.sort) return 0;

    switch (filters.sort) {
      case 'price-low-high':
        const priceA = a.isSale ? (a.salePrice || 0) : a.price;
        const priceB = b.isSale ? (b.salePrice || 0) : b.price;
        return priceA - priceB;
      case 'price-high-low':
        const priceADesc = a.isSale ? (a.salePrice || 0) : a.price;
        const priceBDesc = b.isSale ? (b.salePrice || 0) : b.price;
        return priceBDesc - priceADesc;
      case 'newest':
        return a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });
}

/**
 * Format a price as a currency string
 * @param price - The price to format
 * @param currency - The currency code (default: USD)
 * @param minimumFractionDigits - Minimum fraction digits (default: 0)
 * @param maximumFractionDigits - Maximum fraction digits (default: 0)
 * @returns Formatted price string
 */
export function formatPrice(
  price: number,
  currency: string = 'USD',
  minimumFractionDigits: number = 0,
  maximumFractionDigits: number = 0
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(price);
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generate a unique order number
 * Format: YOURS-YYMMDD-XXXX where:
 * - YOURS is the store prefix
 * - YYMMDD is the current date
 * - XXXX is a random 4-digit number
 * @returns A unique order number string
 */
export function generateOrderNumber(): string {
  const now = new Date();

  // Get date components
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');

  // Generate random 4-digit number
  const random = Math.floor(1000 + Math.random() * 9000);

  // Combine components
  return `YOURS-${year}${month}${day}-${random}`;
}

/**
 * Format a date string
 * @param dateString - The date string to format
 * @returns Formatted date string (e.g., "January 1, 2023")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Format a date with time
 * @param dateString - The date string to format
 * @returns Formatted date and time string (e.g., "January 1, 2023, 12:00 PM")
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
}

/**
 * Format a time string
 * @param dateString - The date string to format
 * @returns Formatted time string (e.g., "12:00 PM")
 */
export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
}

/**
 * Calculate discount percentage
 * @param originalPrice - The original price
 * @param salePrice - The sale price
 * @returns Discount percentage as a number
 */
export function calculateDiscountPercentage(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0 || salePrice >= originalPrice) return 0;
  const discount = ((originalPrice - salePrice) / originalPrice) * 100;
  return Math.round(discount);
}

/**
 * Slugify a string (convert to URL-friendly format)
 * @param text - The text to slugify
 * @returns Slugified string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Get initials from a name
 * @param name - The name to get initials from
 * @returns Initials (up to 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '';

  const parts = name.split(' ').filter(Boolean);

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
