/**
 * Generates a URL-friendly slug from a string
 * 
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

/**
 * Checks if a slug is unique among existing slugs
 * 
 * @param slug The slug to check
 * @param existingSlugs Array of existing slugs to check against
 * @param currentId Optional ID of the current item (to exclude from uniqueness check)
 * @returns A unique slug, possibly with a numeric suffix
 */
export function ensureUniqueSlug(slug: string, existingSlugs: string[], currentId?: string): string {
  // If the slug is empty, generate a timestamp-based slug
  if (!slug || slug.trim() === '') {
    slug = `item-${Date.now()}`;
  }
  
  // Check if the slug is already unique
  if (!existingSlugs.includes(slug)) {
    return slug;
  }
  
  // If this is an update operation and the slug is the same as the original,
  // we don't need to change it (it belongs to this item)
  if (currentId) {
    // We need to check if this exact slug belongs to the current item
    // This requires additional context that we don't have here
    // For now, we'll assume if the slug exists in existingSlugs, it's not this item's
    // This is handled by the caller filtering out the current item's slug from existingSlugs
  }
  
  // If not unique, add a numeric suffix
  let counter = 1;
  let uniqueSlug = `${slug}-${counter}`;
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${slug}-${counter}`;
  }
  
  return uniqueSlug;
}