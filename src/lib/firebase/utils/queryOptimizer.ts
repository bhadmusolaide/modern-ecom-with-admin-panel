/**
 * Firebase Query Optimizer
 *
 * This utility provides optimized query functions for common Firebase Firestore queries.
 * It leverages the indexes defined in firestore.indexes.json to ensure efficient queries.
 */

import {
  collection, query, where, orderBy, limit,
  startAfter, endBefore, getDocs, QueryConstraint,
  DocumentData, QueryDocumentSnapshot, Query,
  doc, getDoc
} from 'firebase/firestore';
import { db } from '../config';
import { retryWithBackoff, logError } from '../../utils/errorHandling';
import { Order, OrderStatus } from '../../types';

/**
 * Interface for pagination options
 */
export interface PaginationOptions {
  pageSize: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>;
  endBeforeDoc?: QueryDocumentSnapshot<DocumentData>;
}

/**
 * Interface for product filter options
 */
export interface ProductFilterOptions {
  category?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'priceDesc' | 'newest';
}

/**
 * Get products with optimized queries
 * @param filters Filter options for products
 * @param pagination Pagination options
 * @returns Query result with products and pagination info
 */
export async function getProducts(
  filters: ProductFilterOptions = {},
  pagination?: PaginationOptions
) {
  try {
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }

    if (filters.isFeatured !== undefined) {
      constraints.push(where('isFeatured', '==', filters.isFeatured));
    }

    if (filters.isNew !== undefined) {
      constraints.push(where('isNew', '==', filters.isNew));
    }

    if (filters.isSale !== undefined) {
      constraints.push(where('isSale', '==', filters.isSale));
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name':
          constraints.push(orderBy('name', 'asc'));
          break;
        case 'price':
          constraints.push(orderBy('price', 'asc'));
          break;
        case 'priceDesc':
          constraints.push(orderBy('price', 'desc'));
          break;
        case 'newest':
          constraints.push(orderBy('createdAt', 'desc'));
          break;
        default:
          // Default sort by name
          constraints.push(orderBy('name', 'asc'));
      }
    } else if (filters.category) {
      // If filtering by category but no sort specified, sort by name
      constraints.push(orderBy('name', 'asc'));
    } else if (filters.isFeatured) {
      // If filtering by featured but no sort specified, sort by name
      constraints.push(orderBy('name', 'asc'));
    }

    // Apply pagination
    if (pagination) {
      constraints.push(limit(pagination.pageSize));

      if (pagination.startAfterDoc) {
        constraints.push(startAfter(pagination.startAfterDoc));
      }

      if (pagination.endBeforeDoc) {
        constraints.push(endBefore(pagination.endBeforeDoc));
      }
    }

    // Create and execute query
    const productsRef = collection(db, 'products');
    const q = query(productsRef, ...constraints);
    const querySnapshot = await getDocs(q);

    // Extract products
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Return products and pagination info
    return {
      products,
      pagination: {
        firstDoc: querySnapshot.docs[0] || null,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        count: querySnapshot.size,
        isEmpty: querySnapshot.empty
      }
    };
  } catch (error) {
    // Check if it's a permission error
    if (error instanceof Error && 
        (error.message.includes('permission') || 
         error.message.includes('insufficient') ||
         error.message.includes('Missing or insufficient permissions'))) {
      console.error('Firebase permission error:', {
        error: error.message,
        filters,
        pagination
      });
      throw new Error('You do not have permission to access this data. Please check your authentication status.');
    }
    
    // Log other errors
    logError(error, {
      function: 'getProducts',
      filters,
      pagination
    });
    
    throw error;
  }
}

// Cache for featured products
const featuredProductsCache = {
  data: null as any[] | null,
  timestamp: 0,
  expiryTime: 5 * 60 * 1000 // 5 minutes in milliseconds
};

/**
 * Get featured products with optimized query
 * @param limitCount Maximum number of products to return
 * @param useCache Whether to use cached data if available
 * @returns Array of featured products
 */
export async function getFeaturedProducts(limitCount = 8, useCache = true) {
  // Check if we have valid cached data
  const now = Date.now();
  if (useCache &&
      featuredProductsCache.data &&
      now - featuredProductsCache.timestamp < featuredProductsCache.expiryTime) {
    console.log('Using cached featured products');
    return featuredProductsCache.data;
  }

  // Define the fetch function to be retried if needed
  const fetchFeaturedProducts = async () => {
    const result = await getProducts(
      { isFeatured: true, sortBy: 'name' },
      { pageSize: limitCount }
    );
    return result.products;
  };

  try {
    // Use retry mechanism with exponential backoff
    const products = await retryWithBackoff(fetchFeaturedProducts, {
      maxRetries: 3,
      initialDelay: 300,
    });

    // Update cache
    featuredProductsCache.data = products;
    featuredProductsCache.timestamp = now;

    return products;
  } catch (error) {
    // Log the error with context
    logError(error, {
      function: 'getFeaturedProducts',
      limitCount,
      useCache
    });

    // If we have cached data, return it even if it's expired
    if (featuredProductsCache.data) {
      console.warn('Using expired cache due to fetch error');
      return featuredProductsCache.data;
    }

    // Otherwise, rethrow the error
    throw error;
  }
}

/**
 * Get new arrivals with optimized query
 * @param limit Maximum number of products to return
 * @returns Array of new products
 */
export async function getNewArrivals(limitCount = 8) {
  const result = await getProducts(
    { isNew: true, sortBy: 'newest' },
    { pageSize: limitCount }
  );
  return result.products;
}

/**
 * Get sale products with optimized query
 * @param limit Maximum number of products to return
 * @returns Array of sale products
 */
export async function getSaleProducts(limitCount = 8) {
  const result = await getProducts(
    { isSale: true, sortBy: 'price' },
    { pageSize: limitCount }
  );
  return result.products;
}

/**
 * Get products by category with optimized query
 * @param category Category ID
 * @param sortBy Sort option
 * @param limit Maximum number of products to return
 * @returns Array of products in the category
 */
export async function getProductsByCategory(
  category: string,
  sortBy: 'name' | 'price' | 'priceDesc' | 'newest' = 'name',
  limitCount = 20
) {
  const result = await getProducts(
    { category, sortBy },
    { pageSize: limitCount }
  );
  return result.products;
}

/**
 * Get categories with optimized query
 * @returns Array of categories
 */
export async function getCategories() {
  const categoriesRef = collection(db, 'categories');
  const q = query(categoriesRef, orderBy('name', 'asc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Cache for categories with product counts
const categoriesWithCountsCache = {
  data: null as any[] | null,
  timestamp: 0,
  expiryTime: 5 * 60 * 1000 // 5 minutes in milliseconds
};

// Cache for product counts by category
const productCountsByCategoryCache = {
  data: {} as Record<string, number>,
  timestamp: 0,
  expiryTime: 5 * 60 * 1000 // 5 minutes in milliseconds
};

/**
 * Get categories with product counts
 * @param useCache Whether to use cached data if available
 * @returns Array of categories with product counts
 */
export async function getCategoriesWithProductCounts(useCache = true) {
  // Check if we have valid cached data
  const now = Date.now();
  if (useCache &&
      categoriesWithCountsCache.data &&
      now - categoriesWithCountsCache.timestamp < categoriesWithCountsCache.expiryTime) {
    console.log('Using cached categories with counts');
    return categoriesWithCountsCache.data;
  }

  // Define the fetch function to be retried if needed
  const fetchCategoriesWithCounts = async () => {
    try {
      // Get all categories
      const categoriesRef = collection(db, 'categories');
      const categoriesQuery = query(categoriesRef, orderBy('order', 'asc'), orderBy('name', 'asc'));
      const categoriesSnapshot = await getDocs(categoriesQuery);

      const categories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        count: 0 // Initialize count to 0
      }));

      // Get product counts for each category
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);

      // Count products for each category
      productsSnapshot.docs.forEach(doc => {
        const product = doc.data();
        const categoryId = product.category;

        if (categoryId) {
          // Find the category and increment its count
          const category = categories.find(c => c.id === categoryId);
          if (category) {
            category.count += 1;
          }
        }
      });

      return categories;
    } catch (error) {
      // Check if it's a permission error
      if (error instanceof Error && 
          (error.message.includes('permission') || 
           error.message.includes('insufficient') ||
           error.message.includes('Missing or insufficient permissions'))) {
        console.error('Firebase permission error in getCategoriesWithProductCounts:', {
          error: error.message
        });
        throw new Error('You do not have permission to access category data. Please check your authentication status.');
      }
      throw error;
    }
  };

  try {
    // Use retry mechanism with exponential backoff
    const categories = await retryWithBackoff(fetchCategoriesWithCounts, {
      maxRetries: 3,
      initialDelay: 300,
    });

    // Update cache
    categoriesWithCountsCache.data = categories;
    categoriesWithCountsCache.timestamp = now;

    return categories;
  } catch (error) {
    // Log the error with context
    logError(error, {
      function: 'getCategoriesWithProductCounts',
      useCache
    });

    // If we have cached data, return it even if it's expired
    if (categoriesWithCountsCache.data) {
      console.warn('Using expired cache due to fetch error');
      return categoriesWithCountsCache.data;
    }

    // Otherwise, rethrow the error
    throw error;
  }
}

/**
 * Get product count by category with optimized query and caching
 * @param categoryId Category ID
 * @param useCache Whether to use cached data if available
 * @returns Number of products in the category
 */
export async function getProductCountByCategory(categoryId: string, useCache = true) {
  const now = Date.now();

  // Check if we have valid cached data for this category
  if (useCache &&
      productCountsByCategoryCache.data[categoryId] !== undefined &&
      now - productCountsByCategoryCache.timestamp < productCountsByCategoryCache.expiryTime) {
    console.log(`Using cached product count for category ${categoryId}`);
    return productCountsByCategoryCache.data[categoryId];
  }

  try {
    // Query products with the specified category
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('category', '==', categoryId));
    const querySnapshot = await getDocs(q);

    const count = querySnapshot.size;

    // Update cache
    if (now - productCountsByCategoryCache.timestamp >= productCountsByCategoryCache.expiryTime) {
      // If cache is expired, reset it completely
      productCountsByCategoryCache.data = {};
      productCountsByCategoryCache.timestamp = now;
    }

    // Add or update this category's count in the cache
    productCountsByCategoryCache.data[categoryId] = count;

    return count;
  } catch (error) {
    console.error(`Error getting product count for category ${categoryId}:`, error);
    throw error;
  }
}

/**
 * Get all product counts by category with optimized query and caching
 * @param useCache Whether to use cached data if available
 * @returns Object mapping category IDs to product counts
 */
export async function getAllProductCountsByCategory(useCache = true) {
  const now = Date.now();

  // Check if we have valid cached data
  if (useCache &&
      Object.keys(productCountsByCategoryCache.data).length > 0 &&
      now - productCountsByCategoryCache.timestamp < productCountsByCategoryCache.expiryTime) {
    console.log('Using cached product counts for all categories');
    return { ...productCountsByCategoryCache.data };
  }

  try {
    // Get all categories first
    const categoriesRef = collection(db, 'categories');
    const categoriesSnapshot = await getDocs(categoriesRef);
    const categoryIds = categoriesSnapshot.docs.map(doc => doc.id);

    // Get all products
    const productsRef = collection(db, 'products');
    const productsSnapshot = await getDocs(productsRef);

    // Count products for each category
    const counts: Record<string, number> = {};
    categoryIds.forEach(id => counts[id] = 0);

    productsSnapshot.docs.forEach(doc => {
      const product = doc.data();
      const categoryId = product.category;

      if (categoryId && counts[categoryId] !== undefined) {
        counts[categoryId]++;
      }
    });

    // Update cache
    productCountsByCategoryCache.data = counts;
    productCountsByCategoryCache.timestamp = now;

    return counts;
  } catch (error) {
    console.error('Error getting all product counts by category:', error);
    throw error;
  }
}

/**
 * Get product by ID with error handling
 * @param productId Product ID
 * @returns Product data or null if not found
 */
export async function getProductById(productId: string) {
  try {
    console.log(`Attempting to fetch product with ID ${productId}`);
    const productDoc = await getDoc(doc(db, 'products', productId));

    if (!productDoc.exists()) {
      console.log(`Product with ID ${productId} not found`);
      return null;
    }

    return {
      id: productDoc.id,
      ...productDoc.data()
    };
  } catch (error) {
    console.error(`Error fetching product with ID ${productId}:`, error);
    throw error;
  }
}

/**
 * Interface for order pagination options
 */
export interface OrderPaginationOptions {
  pageSize: number;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>;
  endBeforeDoc?: QueryDocumentSnapshot<DocumentData>;
}

/**
 * Interface for order filter options
 */
export interface OrderFilterOptions {
  userId?: string;
  status?: OrderStatus | OrderStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  email?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'total' | 'status';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Get orders with optimized queries
 * @param filters Filter options for orders
 * @param pagination Pagination options
 * @returns Query result with orders and pagination info
 */
export async function getOptimizedOrders(
  filters: OrderFilterOptions = {},
  pagination?: OrderPaginationOptions
) {
  try {
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }

    if (filters.email) {
      constraints.push(where('email', '==', filters.email));
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        if (filters.status.length === 1) {
          constraints.push(where('status', '==', filters.status[0]));
        } else if (filters.status.length > 1) {
          constraints.push(where('status', 'in', filters.status));
        }
      } else {
        constraints.push(where('status', '==', filters.status));
      }
    }

    if (filters.dateFrom) {
      constraints.push(where('createdAt', '>=', filters.dateFrom.toISOString()));
    }

    if (filters.dateTo) {
      constraints.push(where('createdAt', '<=', filters.dateTo.toISOString()));
    }

    // Apply sorting
    const sortField = filters.sortBy || 'createdAt';
    const sortDirection = filters.sortDirection || 'desc';
    constraints.push(orderBy(sortField, sortDirection));

    // Apply pagination
    if (pagination) {
      constraints.push(limit(pagination.pageSize));

      if (pagination.startAfterDoc) {
        constraints.push(startAfter(pagination.startAfterDoc));
      }

      if (pagination.endBeforeDoc) {
        constraints.push(endBefore(pagination.endBeforeDoc));
      }
    }

    // Create and execute query
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, ...constraints);

    // Use retry mechanism with exponential backoff
    const fetchOrders = async () => {
      const querySnapshot = await getDocs(q);

      // Extract orders
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      return {
        orders,
        pagination: {
          firstDoc: querySnapshot.docs[0] || null,
          lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
          count: querySnapshot.size,
          isEmpty: querySnapshot.empty
        }
      };
    };

    return await retryWithBackoff(fetchOrders, {
      maxRetries: 3,
      initialDelay: 300,
    });
  } catch (error) {
    // Log the error with context
    logError(error, {
      function: 'getOptimizedOrders',
      filters,
      pagination
    });

    // Rethrow the error
    throw error;
  }
}

// Cache for recent orders
const recentOrdersCache = {
  data: null as Order[] | null,
  timestamp: 0,
  expiryTime: 2 * 60 * 1000 // 2 minutes in milliseconds
};

/**
 * Get recent orders with optimized query and caching
 * @param limitCount Maximum number of orders to return
 * @param useCache Whether to use cached data if available
 * @returns Array of recent orders
 */
export async function getRecentOrders(limitCount = 5, useCache = true) {
  // Check if we have valid cached data
  const now = Date.now();
  if (useCache &&
      recentOrdersCache.data &&
      now - recentOrdersCache.timestamp < recentOrdersCache.expiryTime) {
    console.log('Using cached recent orders');
    return recentOrdersCache.data;
  }

  try {
    const result = await getOptimizedOrders(
      { sortBy: 'createdAt', sortDirection: 'desc' },
      { pageSize: limitCount }
    );

    // Update cache
    recentOrdersCache.data = result.orders;
    recentOrdersCache.timestamp = now;

    return result.orders;
  } catch (error) {
    console.error('Error getting recent orders:', error);

    // If we have cached data, return it even if it's expired
    if (recentOrdersCache.data) {
      console.warn('Using expired cache due to fetch error');
      return recentOrdersCache.data;
    }

    // Otherwise, rethrow the error
    throw error;
  }
}

/**
 * Get orders by status with optimized query
 * @param status Order status or array of statuses
 * @param limitCount Maximum number of orders to return
 * @returns Array of orders with the specified status(es)
 */
export async function getOptimizedOrdersByStatus(
  status: OrderStatus | OrderStatus[],
  limitCount = 10
) {
  try {
    const result = await getOptimizedOrders(
      { status, sortBy: 'createdAt', sortDirection: 'desc' },
      { pageSize: limitCount }
    );

    return result.orders;
  } catch (error) {
    console.error(`Error getting orders by status ${status}:`, error);
    throw error;
  }
}

/**
 * Get orders for a specific user with optimized query
 * @param userId User ID
 * @param limitCount Maximum number of orders to return
 * @returns Array of orders for the user
 */
export async function getOrdersByUser(userId: string, limitCount = 10) {
  try {
    const result = await getOptimizedOrders(
      { userId, sortBy: 'createdAt', sortDirection: 'desc' },
      { pageSize: limitCount }
    );

    return result.orders;
  } catch (error) {
    console.error(`Error getting orders for user ${userId}:`, error);
    throw error;
  }
}

// Cache for order counts by status
const orderCountsByStatusCache = {
  data: null as Record<OrderStatus, number> | null,
  timestamp: 0,
  expiryTime: 5 * 60 * 1000 // 5 minutes in milliseconds
};

/**
 * Get order counts by status with optimized query and caching
 * @param useCache Whether to use cached data if available
 * @returns Object with counts for each status
 */
export async function getOrderCountsByStatus(useCache = true) {
  // Check if we have valid cached data
  const now = Date.now();
  if (useCache &&
      orderCountsByStatusCache.data &&
      now - orderCountsByStatusCache.timestamp < orderCountsByStatusCache.expiryTime) {
    console.log('Using cached order counts by status');
    return orderCountsByStatusCache.data;
  }

  try {
    // Initialize counts object with all statuses set to 0
    const counts: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.PROCESSING]: 0,
      [OrderStatus.SHIPPED]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.REFUNDED]: 0,
      [OrderStatus.ON_HOLD]: 0,
      [OrderStatus.BACKORDERED]: 0,
      [OrderStatus.PARTIALLY_SHIPPED]: 0,
      [OrderStatus.AWAITING_STOCK]: 0,
      [OrderStatus.READY_FOR_PICKUP]: 0
    };

    // Get all orders
    const ordersRef = collection(db, 'orders');
    const querySnapshot = await getDocs(ordersRef);

    // Count orders by status
    querySnapshot.docs.forEach(doc => {
      const order = doc.data() as Order;
      if (order.status && counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    });

    // Update cache
    orderCountsByStatusCache.data = counts;
    orderCountsByStatusCache.timestamp = now;

    return counts;
  } catch (error) {
    console.error('Error getting order counts by status:', error);

    // If we have cached data, return it even if it's expired
    if (orderCountsByStatusCache.data) {
      console.warn('Using expired cache due to fetch error');
      return orderCountsByStatusCache.data;
    }

    // Otherwise, rethrow the error
    throw error;
  }
}

/**
 * Get user by email with optimized query
 * @param email User email
 * @returns User data or null if not found
 */
export async function getUserByEmail(email: string) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  };
}

/**
 * Get users by role with optimized query
 * @param role User role
 * @param pagination Pagination options
 * @returns Query result with users and pagination info
 */
export async function getUsersByRole(
  role: string,
  pagination?: PaginationOptions
) {
  const constraints: QueryConstraint[] = [
    where('role', '==', role),
    orderBy('createdAt', 'desc')
  ];

  if (pagination) {
    constraints.push(limit(pagination.pageSize));

    if (pagination.startAfterDoc) {
      constraints.push(startAfter(pagination.startAfterDoc));
    }

    if (pagination.endBeforeDoc) {
      constraints.push(endBefore(pagination.endBeforeDoc));
    }
  }

  const usersRef = collection(db, 'users');
  const q = query(usersRef, ...constraints);
  const querySnapshot = await getDocs(q);

  const users = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return {
    users,
    pagination: {
      firstDoc: querySnapshot.docs[0] || null,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      count: querySnapshot.size,
      isEmpty: querySnapshot.empty
    }
  };
}

/**
 * Get orders for a user with optimized query
 * @param userId User ID
 * @param pagination Pagination options
 * @returns Query result with orders and pagination info
 */
export async function getUserOrders(
  userId: string,
  pagination?: PaginationOptions
) {
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  ];

  if (pagination) {
    constraints.push(limit(pagination.pageSize));

    if (pagination.startAfterDoc) {
      constraints.push(startAfter(pagination.startAfterDoc));
    }

    if (pagination.endBeforeDoc) {
      constraints.push(endBefore(pagination.endBeforeDoc));
    }
  }

  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, ...constraints);
  const querySnapshot = await getDocs(q);

  const orders = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return {
    orders,
    pagination: {
      firstDoc: querySnapshot.docs[0] || null,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      count: querySnapshot.size,
      isEmpty: querySnapshot.empty
    }
  };
}

/**
 * Get orders by status with optimized query
 * @param status Order status
 * @param pagination Pagination options
 * @returns Query result with orders and pagination info
 */
export async function getOrdersByStatus(
  status: string,
  pagination?: PaginationOptions
) {
  const constraints: QueryConstraint[] = [
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  ];

  if (pagination) {
    constraints.push(limit(pagination.pageSize));

    if (pagination.startAfterDoc) {
      constraints.push(startAfter(pagination.startAfterDoc));
    }

    if (pagination.endBeforeDoc) {
      constraints.push(endBefore(pagination.endBeforeDoc));
    }
  }

  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, ...constraints);
  const querySnapshot = await getDocs(q);

  const orders = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return {
    orders,
    pagination: {
      firstDoc: querySnapshot.docs[0] || null,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      count: querySnapshot.size,
      isEmpty: querySnapshot.empty
    }
  };
}
