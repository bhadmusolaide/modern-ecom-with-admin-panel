/**
 * Customer Data Access Layer
 *
 * This file contains functions for managing customers in Firebase.
 */

import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, endBefore,
  serverTimestamp, Timestamp, DocumentReference, DocumentData,
  QueryDocumentSnapshot, writeBatch, increment, documentId
} from 'firebase/firestore';
import { db } from './config';
import { auth } from './config';
import {
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  deleteUser
} from 'firebase/auth';
import {
  User,
  UserRole,
  CustomerSegment,
  SegmentCriteria,
  Order
} from '../types';

// Collection references
const USERS_COLLECTION = 'users';
const CUSTOMERS_COLLECTION = 'customers';
const SEGMENTS_COLLECTION = 'customer-segments';
const ORDERS_COLLECTION = 'orders';

const usersRef = collection(db, USERS_COLLECTION);
const customersRef = collection(db, CUSTOMERS_COLLECTION);
const segmentsRef = collection(db, SEGMENTS_COLLECTION);

/**
 * Convert Firestore data to User
 */
const convertToCustomer = (id: string, data: any): User => {
  return {
    id,
    email: data.email,
    name: data.name || null,
    role: data.role || UserRole.CUSTOMER,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    lastLoginAt: data.lastLoginAt?.toDate(),
    lastOrderDate: data.lastOrderDate?.toDate(),
    phone: data.phone || null,
    address: data.address || null,
    isActive: data.isActive !== false, // Default to true if not specified
    emailVerified: data.emailVerified || false,
    segment: data.segment || [],
    totalOrders: data.totalOrders || 0,
    totalSpent: data.totalSpent || 0,
    notes: data.notes || null,
    avatar: data.avatar || null,
    permissions: data.permissions || []
  };
};

/**
 * Get all customers
 */
export const getCustomers = async (options: {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  startAfter?: QueryDocumentSnapshot<DocumentData>;
  endBefore?: QueryDocumentSnapshot<DocumentData>;
  filters?: {
    isActive?: boolean;
    segment?: string;
    minSpent?: number;
    maxSpent?: number;
    minOrders?: number;
    maxOrders?: number;
  };
} = {}) => {
  try {
    console.log('Firebase getCustomers: Starting to fetch customers');

    const {
      sortBy = 'createdAt',
      sortDirection = 'desc',
      limit: limitCount = 50,
      startAfter: startAfterDoc,
      endBefore: endBeforeDoc,
      filters = {}
    } = options;

    console.log(`Firebase getCustomers: Using sort ${sortBy} ${sortDirection}, limit ${limitCount}`);
    console.log('Firebase getCustomers: Applied filters:', JSON.stringify(filters));

    // Start building the query
    let customersQuery = query(customersRef);

    // Apply filters
    if (filters.isActive !== undefined) {
      customersQuery = query(
        customersQuery,
        where('isActive', '==', filters.isActive)
      );
    }

    if (filters.segment) {
      customersQuery = query(
        customersQuery,
        where('segment', 'array-contains', filters.segment)
      );
    }

    if (filters.minSpent !== undefined) {
      customersQuery = query(
        customersQuery,
        where('totalSpent', '>=', filters.minSpent)
      );
    }

    if (filters.maxSpent !== undefined) {
      customersQuery = query(
        customersQuery,
        where('totalSpent', '<=', filters.maxSpent)
      );
    }

    if (filters.minOrders !== undefined) {
      customersQuery = query(
        customersQuery,
        where('totalOrders', '>=', filters.minOrders)
      );
    }

    if (filters.maxOrders !== undefined) {
      customersQuery = query(
        customersQuery,
        where('totalOrders', '<=', filters.maxOrders)
      );
    }

    // Apply sorting
    customersQuery = query(
      customersQuery,
      orderBy(sortBy, sortDirection)
    );

    // Apply pagination
    if (startAfterDoc) {
      customersQuery = query(
        customersQuery,
        startAfter(startAfterDoc)
      );
    } else if (endBeforeDoc) {
      customersQuery = query(
        customersQuery,
        endBefore(endBeforeDoc)
      );
    }

    // Apply limit
    customersQuery = query(
      customersQuery,
      limit(limitCount)
    );

    console.log('Firebase getCustomers: Query built, executing...');
    console.log('Firebase getCustomers: Query details:', {
      collection: CUSTOMERS_COLLECTION,
      filters,
      sort: {
        field: sortBy,
        direction: sortDirection
      },
      limit: limitCount
    });

    // Execute the query
    try {
      const snapshot = await getDocs(customersQuery);
      console.log(`Firebase getCustomers: Query executed, got ${snapshot.docs.length} documents`);

      // Convert the documents to User objects
      const customers = snapshot.docs.map(doc => {
        try {
          return convertToCustomer(doc.id, doc.data());
        } catch (conversionError) {
          console.error(`Firebase getCustomers: Error converting customer ${doc.id}:`, conversionError);
          console.error('Raw document data:', doc.data());
          // Return a minimal valid customer object to prevent the entire operation from failing
          return {
            id: doc.id,
            email: doc.data().email || 'unknown@example.com',
            role: UserRole.CUSTOMER,
            isActive: false,
            emailVerified: false,
            segment: [],
            totalOrders: 0,
            totalSpent: 0,
            permissions: []
          };
        }
      });

      console.log(`Firebase getCustomers: Successfully converted ${customers.length} customers`);

      // Return the customers and the last document for pagination
      return {
        customers,
        lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
        firstDoc: snapshot.docs.length > 0 ? snapshot.docs[0] : null
      };
    } catch (queryError) {
      console.error('Firebase getCustomers: Error executing query:', queryError);
      console.error('Error details:', queryError instanceof Error ? queryError.message : 'Unknown error');
      console.error('Error stack:', queryError instanceof Error ? queryError.stack : 'No stack trace');

      // Check if it's an index error
      if (queryError instanceof Error && queryError.message.includes('index')) {
        console.error('Firebase getCustomers: Index error detected. Please ensure the following index exists:');
        console.error(`Collection: ${CUSTOMERS_COLLECTION}`);
        console.error(`Fields: ${sortBy} (${sortDirection.toUpperCase()})`);
      }

      throw new Error(`Error executing Firestore query: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Firebase getCustomers: Error getting customers:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
};

/**
 * Search customers by name or email
 */
export const searchCustomers = async (
  searchTerm: string,
  limit: number = 10
) => {
  try {
    // Firestore doesn't support direct text search, so we'll fetch all customers
    // and filter them on the client side
    const { customers } = await getCustomers({ limit: 100 });

    // Filter customers by name or email
    const filteredCustomers = customers.filter(customer => {
      const nameMatch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || emailMatch;
    });

    // Return the limited number of results
    return filteredCustomers.slice(0, limit);
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
};

/**
 * Check if a customer ID exists in the database
 */
export const checkCustomerIdExists = async (id: string): Promise<boolean> => {
  try {
    console.log(`Firebase checkCustomerIdExists: Checking if customer ID exists: ${id}`);

    if (!id) {
      console.error('Firebase checkCustomerIdExists: Invalid customer ID provided');
      return false;
    }

    // First try direct document lookup which is faster
    const customerRef = doc(db, CUSTOMERS_COLLECTION, id);
    const customerDoc = await getDoc(customerRef);

    if (customerDoc.exists()) {
      console.log(`Firebase checkCustomerIdExists: Customer ID ${id} exists in customers collection`);
      return true;
    }

    // If direct lookup fails, try a query to be absolutely sure
    // This is a more expensive operation but can help diagnose issues
    const customerQuery = query(
      collection(db, CUSTOMERS_COLLECTION),
      where(documentId(), '==', id)
    );

    const querySnapshot = await getDocs(customerQuery);
    const exists = !querySnapshot.empty;

    console.log(`Firebase checkCustomerIdExists: Customer ID ${id} ${exists ? 'exists' : 'does not exist'} in customers collection (via query)`);
    return exists;
  } catch (error) {
    console.error(`Firebase checkCustomerIdExists: Error checking if customer ID ${id} exists:`, error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    // Return false on error to be safe
    return false;
  }
};

/**
 * Get a customer by ID
 */
export const getCustomerById = async (id: string) => {
  try {
    console.log(`Firebase getCustomerById: Fetching customer with ID: ${id}`);

    if (!id) {
      console.error('Firebase getCustomerById: Invalid customer ID provided:', id);
      throw new Error('Invalid customer ID');
    }

    // First check if the ID exists
    const idExists = await checkCustomerIdExists(id);
    if (!idExists) {
      console.error(`Firebase getCustomerById: Customer ID ${id} does not exist in the customers collection`);
      throw new Error('Customer not found');
    }

    // Use client SDK
    const customerRef = doc(db, CUSTOMERS_COLLECTION, id);
    console.log(`Firebase getCustomerById: Created reference to document: ${CUSTOMERS_COLLECTION}/${id}`);

    const customerDoc = await getDoc(customerRef);
    console.log(`Firebase getCustomerById: Document fetch completed, exists: ${customerDoc.exists()}`);

    if (!customerDoc.exists()) {
      console.error(`Firebase getCustomerById: Customer with ID ${id} not found in Firestore`);
      throw new Error('Customer not found');
    }

    const data = customerDoc.data();
    console.log(`Firebase getCustomerById: Raw customer data:`, data);

    // Convert the customer data
    const customer = convertToCustomer(customerDoc.id, data);
    console.log(`Firebase getCustomerById: Successfully converted customer data for ${id}`);

    return customer;
  } catch (error) {
    console.error(`Firebase getCustomerById: Error getting customer with ID ${id}:`, error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
};

/**
 * Update a customer
 */
export const updateCustomer = async (
  id: string,
  data: Partial<User>
) => {
  try {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, id);

    // Get the current customer data
    const customerDoc = await getDoc(customerRef);

    if (!customerDoc.exists()) {
      throw new Error('Customer not found');
    }

    // Prepare the update data
    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    // Add fields to update
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.segment !== undefined) updateData.segment = data.segment;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    // Update the customer in Firestore
    await updateDoc(customerRef, updateData);

    // If email is being updated and there's a userId associated with this customer,
    // we should update the email in Firebase Auth as well
    if (data.email !== undefined && data.email !== customerDoc.data().email) {
      const userId = customerDoc.data().userId;
      if (userId) {
        try {
          // If the customer has a userId, we can try to update their email in Auth
          const user = auth.currentUser;
          if (user && user.uid === userId) {
            await updateEmail(user, data.email);
          } else {
            console.warn('Cannot update email for another user in Firebase Auth');
          }

          // Always update the email in Firestore
          await updateDoc(customerRef, { email: data.email });
        } catch (authError) {
          console.error('Error updating email in Firebase Auth:', authError);
          // Continue with the Firestore update even if Auth update fails
          await updateDoc(customerRef, { email: data.email });
        }
      } else {
        // If no userId, just update the email in Firestore
        await updateDoc(customerRef, { email: data.email });
      }
    }

    // Get the updated customer
    const updatedCustomerDoc = await getDoc(customerRef);
    return convertToCustomer(updatedCustomerDoc.id, updatedCustomerDoc.data());
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

/**
 * Activate or deactivate a customer
 */
export const setCustomerActiveStatus = async (
  id: string,
  isActive: boolean
) => {
  try {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, id);

    await updateDoc(customerRef, {
      isActive,
      updatedAt: serverTimestamp()
    });

    return { success: true, isActive };
  } catch (error) {
    console.error('Error setting customer active status:', error);
    throw error;
  }
};

/**
 * Reset a customer's password
 */
export const resetCustomerPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Error resetting customer password:', error);
    throw error;
  }
};

/**
 * Get customer purchase history
 */
export const getCustomerOrders = async (
  customerId: string,
  options: {
    limit?: number;
    sortDirection?: 'asc' | 'desc';
    startAfter?: QueryDocumentSnapshot<DocumentData>;
  } = {}
) => {
  try {
    const {
      limit: limitCount = 10,
      sortDirection = 'desc',
      startAfter: startAfterDoc
    } = options;

    // Get the customer to check if it exists and get the userId if available
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const customerDoc = await getDoc(customerRef);

    if (!customerDoc.exists()) {
      throw new Error('Customer not found');
    }

    const customerData = customerDoc.data();
    const userId = customerData.userId;

    // Build the query based on available data
    let ordersQuery;

    if (userId) {
      // If we have a userId, query by that first
      ordersQuery = query(
        collection(db, ORDERS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', sortDirection)
      );
    } else {
      // Otherwise, query by customerId
      ordersQuery = query(
        collection(db, ORDERS_COLLECTION),
        where('customerId', '==', customerId),
        orderBy('createdAt', sortDirection)
      );
    }

    // Apply pagination
    if (startAfterDoc) {
      ordersQuery = query(
        ordersQuery,
        startAfter(startAfterDoc)
      );
    }

    // Apply limit
    ordersQuery = query(
      ordersQuery,
      limit(limitCount)
    );

    // Execute the query
    const snapshot = await getDocs(ordersQuery);

    // Convert the documents to Order objects
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));

    return {
      orders,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
    };
  } catch (error) {
    console.error('Error getting customer orders:', error);
    throw error;
  }
};

/**
 * Calculate customer lifetime value
 */
export const calculateCustomerLifetimeValue = async (customerId: string) => {
  try {
    // Get the customer to check if it exists and get the userId if available
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const customerDoc = await getDoc(customerRef);

    if (!customerDoc.exists()) {
      throw new Error('Customer not found');
    }

    const customerData = customerDoc.data();
    const userId = customerData.userId;

    // Build the query based on available data
    let ordersQuery;

    if (userId) {
      // If we have a userId, query by that first
      ordersQuery = query(
        collection(db, ORDERS_COLLECTION),
        where('userId', '==', userId)
      );
    } else {
      // Otherwise, query by customerId
      ordersQuery = query(
        collection(db, ORDERS_COLLECTION),
        where('customerId', '==', customerId)
      );
    }

    const snapshot = await getDocs(ordersQuery);

    // Calculate total spent
    let totalSpent = 0;
    snapshot.docs.forEach(doc => {
      const order = doc.data() as Order;
      totalSpent += order.total || 0;
    });

    // Update the customer with the calculated values
    await updateDoc(customerRef, {
      totalOrders: snapshot.docs.length,
      totalSpent,
      updatedAt: serverTimestamp()
    });

    return {
      totalOrders: snapshot.docs.length,
      totalSpent
    };
  } catch (error) {
    console.error('Error calculating customer lifetime value:', error);
    throw error;
  }
};

/**
 * Get all customer segments
 */
export const getCustomerSegments = async () => {
  try {
    console.log('Firebase getCustomerSegments: Starting to fetch segments');

    try {
      const snapshot = await getDocs(segmentsRef);
      console.log(`Firebase getCustomerSegments: Query executed, got ${snapshot.docs.length} documents`);

      // Convert the documents to CustomerSegment objects
      const segments = snapshot.docs.map(doc => {
        try {
          return {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          } as CustomerSegment;
        } catch (conversionError) {
          console.error(`Firebase getCustomerSegments: Error converting segment ${doc.id}:`, conversionError);
          // Return a minimal valid segment object to prevent the entire operation from failing
          return {
            id: doc.id,
            name: doc.data()?.name || 'Unknown Segment',
            description: '',
            isActive: false,
            customerCount: 0,
            criteria: {}
          } as CustomerSegment;
        }
      });

      console.log(`Firebase getCustomerSegments: Successfully converted ${segments.length} segments`);

      return segments;
    } catch (queryError) {
      console.error('Firebase getCustomerSegments: Error executing query:', queryError);
      console.error('Error details:', queryError instanceof Error ? queryError.message : 'Unknown error');
      console.error('Error stack:', queryError instanceof Error ? queryError.stack : 'No stack trace');

      // Return empty array instead of throwing to prevent UI from breaking
      return [];
    }
  } catch (error) {
    console.error('Firebase getCustomerSegments: Error getting customer segments:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
};

/**
 * Create a new customer segment
 */
export const createCustomerSegment = async (
  segmentData: Omit<CustomerSegment, 'id' | 'createdAt' | 'updatedAt' | 'customerCount'>
) => {
  try {
    const newSegmentRef = await addDoc(segmentsRef, {
      ...segmentData,
      customerCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: segmentData.isActive !== false // Default to true if not specified
    });

    const newSegmentDoc = await getDoc(newSegmentRef);

    return {
      id: newSegmentDoc.id,
      ...newSegmentDoc.data(),
      createdAt: newSegmentDoc.data()?.createdAt?.toDate(),
      updatedAt: newSegmentDoc.data()?.updatedAt?.toDate()
    } as CustomerSegment;
  } catch (error) {
    console.error('Error creating customer segment:', error);
    throw error;
  }
};

/**
 * Update a customer segment
 */
export const updateCustomerSegment = async (
  id: string,
  segmentData: Partial<CustomerSegment>
) => {
  try {
    const segmentRef = doc(db, SEGMENTS_COLLECTION, id);

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    // Add fields to update
    if (segmentData.name !== undefined) updateData.name = segmentData.name;
    if (segmentData.description !== undefined) updateData.description = segmentData.description;
    if (segmentData.criteria !== undefined) updateData.criteria = segmentData.criteria;
    if (segmentData.isActive !== undefined) updateData.isActive = segmentData.isActive;

    await updateDoc(segmentRef, updateData);

    const updatedSegmentDoc = await getDoc(segmentRef);

    return {
      id: updatedSegmentDoc.id,
      ...updatedSegmentDoc.data(),
      createdAt: updatedSegmentDoc.data()?.createdAt?.toDate(),
      updatedAt: updatedSegmentDoc.data()?.updatedAt?.toDate()
    } as CustomerSegment;
  } catch (error) {
    console.error('Error updating customer segment:', error);
    throw error;
  }
};

/**
 * Delete a customer segment
 */
export const deleteCustomerSegment = async (id: string) => {
  try {
    // First, remove this segment from all customers who have it
    const customersWithSegmentQuery = query(
      customersRef,
      where('segment', 'array-contains', id)
    );

    const snapshot = await getDocs(customersWithSegmentQuery);

    // Use a batch to update all customers
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
      const customerData = doc.data();
      const updatedSegments = (customerData.segment || []).filter(
        (segmentId: string) => segmentId !== id
      );

      batch.update(doc.ref, {
        segment: updatedSegments,
        updatedAt: serverTimestamp()
      });
    });

    // Commit the batch
    await batch.commit();

    // Then delete the segment
    await deleteDoc(doc(db, SEGMENTS_COLLECTION, id));

    return { success: true };
  } catch (error) {
    console.error('Error deleting customer segment:', error);
    throw error;
  }
};

/**
 * Assign customers to a segment
 */
export const assignCustomersToSegment = async (
  customerIds: string[],
  segmentId: string
) => {
  try {
    // Get the segment to make sure it exists
    const segmentRef = doc(db, SEGMENTS_COLLECTION, segmentId);
    const segmentDoc = await getDoc(segmentRef);

    if (!segmentDoc.exists()) {
      throw new Error('Segment not found');
    }

    // Use a batch to update all customers
    const batch = writeBatch(db);

    // Update each customer
    for (const customerId of customerIds) {
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
      const customerDoc = await getDoc(customerRef);

      if (customerDoc.exists()) {
        const customerData = customerDoc.data();
        const currentSegments = customerData.segment || [];

        // Only add the segment if it's not already there
        if (!currentSegments.includes(segmentId)) {
          batch.update(customerRef, {
            segment: [...currentSegments, segmentId],
            updatedAt: serverTimestamp()
          });
        }
      }
    }

    // Update the segment's customer count
    batch.update(segmentRef, {
      customerCount: increment(customerIds.length),
      updatedAt: serverTimestamp()
    });

    // Commit the batch
    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error assigning customers to segment:', error);
    throw error;
  }
};

/**
 * Remove customers from a segment
 */
export const removeCustomersFromSegment = async (
  customerIds: string[],
  segmentId: string
) => {
  try {
    // Get the segment to make sure it exists
    const segmentRef = doc(db, SEGMENTS_COLLECTION, segmentId);
    const segmentDoc = await getDoc(segmentRef);

    if (!segmentDoc.exists()) {
      throw new Error('Segment not found');
    }

    // Use a batch to update all customers
    const batch = writeBatch(db);

    let removedCount = 0;

    // Update each customer
    for (const customerId of customerIds) {
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
      const customerDoc = await getDoc(customerRef);

      if (customerDoc.exists()) {
        const customerData = customerDoc.data();
        const currentSegments = customerData.segment || [];

        // Only remove the segment if it's there
        if (currentSegments.includes(segmentId)) {
          batch.update(customerRef, {
            segment: currentSegments.filter(id => id !== segmentId),
            updatedAt: serverTimestamp()
          });

          removedCount++;
        }
      }
    }

    // Update the segment's customer count
    if (removedCount > 0) {
      batch.update(segmentRef, {
        customerCount: increment(-removedCount),
        updatedAt: serverTimestamp()
      });
    }

    // Commit the batch
    await batch.commit();

    return { success: true, removedCount };
  } catch (error) {
    console.error('Error removing customers from segment:', error);
    throw error;
  }
};

/**
 * Apply segment criteria to find matching customers
 */
export const findCustomersMatchingSegmentCriteria = async (
  criteria: SegmentCriteria
) => {
  try {
    // This is a complex operation that might require multiple queries
    // Start with a base query for all customers
    let customersQuery = query(customersRef);

    // Apply filters based on criteria
    if (criteria.minSpent !== undefined) {
      customersQuery = query(
        customersQuery,
        where('totalSpent', '>=', criteria.minSpent)
      );
    }

    if (criteria.maxSpent !== undefined) {
      customersQuery = query(
        customersQuery,
        where('totalSpent', '<=', criteria.maxSpent)
      );
    }

    if (criteria.minOrders !== undefined) {
      customersQuery = query(
        customersQuery,
        where('totalOrders', '>=', criteria.minOrders)
      );
    }

    if (criteria.maxOrders !== undefined) {
      customersQuery = query(
        customersQuery,
        where('totalOrders', '<=', criteria.maxOrders)
      );
    }

    // Execute the query
    const snapshot = await getDocs(customersQuery);

    // Convert the documents to User objects
    let customers = snapshot.docs.map(doc =>
      convertToCustomer(doc.id, doc.data())
    );

    // Apply additional filters that can't be done in the query
    if (criteria.dateRange) {
      customers = customers.filter(customer => {
        if (!customer.lastOrderDate) return false;

        const lastOrderDate = customer.lastOrderDate;

        if (criteria.dateRange.start && lastOrderDate < criteria.dateRange.start) {
          return false;
        }

        if (criteria.dateRange.end && lastOrderDate > criteria.dateRange.end) {
          return false;
        }

        return true;
      });
    }

    // For purchased products and categories, we would need to query the orders collection
    // This is a simplified implementation
    if (criteria.purchasedProducts?.length || criteria.purchasedCategories?.length) {
      // This would require additional queries to the orders collection
      console.warn('Filtering by purchased products/categories requires additional implementation');
    }

    return customers;
  } catch (error) {
    console.error('Error finding customers matching segment criteria:', error);
    throw error;
  }
};

/**
 * Get customer analytics data
 */
export const getCustomerAnalytics = async () => {
  try {
    // Get all customers
    const customersQuery = query(customersRef);

    const snapshot = await getDocs(customersQuery);
    const customers = snapshot.docs.map(doc =>
      convertToCustomer(doc.id, doc.data())
    );

    // Calculate analytics
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.isActive).length;
    const inactiveCustomers = totalCustomers - activeCustomers;

    // Calculate average order value and total revenue
    let totalRevenue = 0;
    let totalOrders = 0;

    customers.forEach(customer => {
      totalRevenue += customer.totalSpent || 0;
      totalOrders += customer.totalOrders || 0;
    });

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const averageCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    // Get new customers in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCustomers = customers.filter(
      customer => customer.createdAt && customer.createdAt > thirtyDaysAgo
    ).length;

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      newCustomers,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      averageCustomerValue
    };
  } catch (error) {
    console.error('Error getting customer analytics:', error);
    throw error;
  }
};
