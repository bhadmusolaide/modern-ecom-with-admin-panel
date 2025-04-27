/**
 * Customer API Client
 *
 * This file provides a client for the customer API endpoints.
 * It ensures all requests include authentication tokens and handles errors properly.
 */

import { safeFetch } from './safeFetch';
import { User, CustomerSegment } from '@/lib/types';

/**
 * Get all customers
 */
export const getCustomers = async (options: any = {}) => {
  try {
    console.log('customerApi: Fetching customers from API');

    try {
      const data = await safeFetch('/api/admin/customers');

      if (!data) {
        console.error('customerApi: No data returned from API');
        throw new Error('No data returned from API');
      }

      if (!data.customers) {
        console.error('customerApi: No customers property in API response', data);
        throw new Error('Invalid API response format: missing customers property');
      }

      console.log(`customerApi: Successfully fetched ${data.customers.length} customers from API`);

      return {
        customers: data.customers,
        lastDoc: null, // API doesn't support cursor pagination
        firstDoc: null
      };
    } catch (apiError) {
      console.error('customerApi: API error fetching customers:', apiError);
      console.error('Error details:', apiError instanceof Error ? apiError.message : 'Unknown error');
      console.error('Error stack:', apiError instanceof Error ? apiError.stack : 'No stack trace');

      // Rethrow with more context
      throw new Error(`API error fetching customers: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('customerApi: Error in getCustomers:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
};

/**
 * Get customer by ID
 */
export const getCustomerById = async (id: string) => {
  try {
    const data = await safeFetch(`/api/admin/customers/${id}`);
    return data.customer;
  } catch (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw error;
  }
};

/**
 * Update customer
 */
export const updateCustomer = async (id: string, customerData: Partial<User>) => {
  try {
    const data = await safeFetch(`/api/admin/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customerData)
    });
    return data.customer;
  } catch (error) {
    console.error(`Error updating customer ${id}:`, error);
    throw error;
  }
};

/**
 * Set customer active status
 */
export const setCustomerActiveStatus = async (id: string, isActive: boolean) => {
  try {
    const data = await safeFetch(`/api/admin/customers/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive })
    });
    return data;
  } catch (error) {
    console.error(`Error setting customer ${id} status:`, error);
    throw error;
  }
};

/**
 * Reset customer password
 */
export const resetCustomerPassword = async (id: string) => {
  try {
    const data = await safeFetch(`/api/admin/customers/${id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    return data;
  } catch (error) {
    console.error(`Error resetting password for customer ${id}:`, error);
    throw error;
  }
};

/**
 * Get customer orders
 */
export const getCustomerOrders = async (id: string, options: any = {}) => {
  try {
    const data = await safeFetch(`/api/admin/customers/${id}/orders`);
    return {
      orders: data.orders || [],
      lastDoc: null // API doesn't support cursor pagination
    };
  } catch (error) {
    console.error(`Error fetching orders for customer ${id}:`, error);
    throw error;
  }
};

/**
 * Get customer segments
 */
export const getCustomerSegments = async () => {
  try {
    console.log('customerApi: Fetching customer segments from API');

    try {
      const data = await safeFetch('/api/admin/customer-segments');

      if (!data) {
        console.error('customerApi: No data returned from segments API');
        throw new Error('No data returned from segments API');
      }

      if (!data.segments) {
        console.error('customerApi: No segments property in API response', data);
        // Return empty array instead of throwing to prevent UI from breaking
        return [];
      }

      console.log(`customerApi: Successfully fetched ${data.segments.length} segments from API`);
      return data.segments;
    } catch (apiError) {
      console.error('customerApi: API error fetching segments:', apiError);
      console.error('Error details:', apiError instanceof Error ? apiError.message : 'Unknown error');
      console.error('Error stack:', apiError instanceof Error ? apiError.stack : 'No stack trace');

      // Return empty array instead of throwing to prevent UI from breaking
      return [];
    }
  } catch (error) {
    console.error('customerApi: Error in getCustomerSegments:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
};

/**
 * Calculate customer lifetime value
 */
export const calculateCustomerLifetimeValue = async (id: string) => {
  try {
    const data = await safeFetch(`/api/admin/customers/${id}/lifetime-value`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    return data;
  } catch (error) {
    console.error(`Error calculating lifetime value for customer ${id}:`, error);
    throw error;
  }
};
