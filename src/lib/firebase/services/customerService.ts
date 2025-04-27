/**
 * Customer Service
 * 
 * This file provides functions for managing customers in Firebase.
 */

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, endBefore,
  serverTimestamp, Timestamp, DocumentReference, DocumentData,
  QueryDocumentSnapshot, writeBatch, increment, addDoc
} from 'firebase/firestore';
import { db } from '../config';
import { Customer, Address, CustomerSegment, SegmentCriteria } from '@/lib/types';

// Collection reference
const CUSTOMERS_COLLECTION = 'customers';
const ORDERS_COLLECTION = 'orders';
const SEGMENTS_COLLECTION = 'customer-segments';

const customersRef = collection(db, CUSTOMERS_COLLECTION);
const segmentsRef = collection(db, SEGMENTS_COLLECTION);

/**
 * Convert Firestore data to Customer
 */
const convertToCustomer = (id: string, data: any): Customer => {
  return {
    id,
    email: data.email,
    name: data.name || null,
    userId: data.userId || null,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
    lastOrderDate: data.lastOrderDate?.toDate(),
    phone: data.phone || null,
    address: data.address || null,
    isActive: data.isActive !== false, // Default to true if not specified
    emailVerified: data.emailVerified || false,
    segment: data.segment || [],
    totalOrders: data.totalOrders || 0,
    totalSpent: data.totalSpent || 0,
    notes: data.notes || null,
    avatar: data.avatar || null
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

    // Execute the query
    try {
      const snapshot = await getDocs(customersQuery);
      console.log(`Firebase getCustomers: Query executed, got ${snapshot.docs.length} documents`);

      // Convert the documents to Customer objects
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
            isActive: false,
            emailVerified: false,
            segment: [],
            totalOrders: 0,
            totalSpent: 0
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
 * Get a customer by ID
 */
export const getCustomerById = async (id: string) => {
  try {
    const customerDoc = await getDoc(doc(db, CUSTOMERS_COLLECTION, id));

    if (!customerDoc.exists()) {
      throw new Error('Customer not found');
    }

    return convertToCustomer(customerDoc.id, customerDoc.data());
  } catch (error) {
    console.error('Error getting customer by ID:', error);
    throw error;
  }
};

/**
 * Get a customer by email
 */
export const getCustomerByEmail = async (email: string) => {
  try {
    const customersQuery = query(
      customersRef,
      where('email', '==', email),
      limit(1)
    );

    const snapshot = await getDocs(customersQuery);

    if (snapshot.empty) {
      return null;
    }

    return convertToCustomer(snapshot.docs[0].id, snapshot.docs[0].data());
  } catch (error) {
    console.error('Error getting customer by email:', error);
    throw error;
  }
};

/**
 * Get a customer by user ID
 */
export const getCustomerByUserId = async (userId: string) => {
  try {
    const customersQuery = query(
      customersRef,
      where('userId', '==', userId),
      limit(1)
    );

    const snapshot = await getDocs(customersQuery);

    if (snapshot.empty) {
      return null;
    }

    return convertToCustomer(snapshot.docs[0].id, snapshot.docs[0].data());
  } catch (error) {
    console.error('Error getting customer by user ID:', error);
    throw error;
  }
};

/**
 * Create a new customer
 */
export const createCustomer = async (customerData: {
  email: string;
  name?: string;
  phone?: string;
  address?: Address;
  userId?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  segment?: string[];
  notes?: string;
}): Promise<Customer> => {
  try {
    // Check if customer with this email already exists
    const existingCustomer = await getCustomerByEmail(customerData.email);
    
    if (existingCustomer) {
      throw new Error('Customer with this email already exists');
    }

    // Create a new customer document
    const customerRef = doc(customersRef);
    
    const newCustomerData = {
      ...customerData,
      isActive: customerData.isActive !== false, // Default to true
      emailVerified: customerData.emailVerified || false,
      segment: customerData.segment || [],
      totalOrders: 0,
      totalSpent: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(customerRef, newCustomerData);

    // Get the created customer
    const createdCustomerDoc = await getDoc(customerRef);
    
    return convertToCustomer(createdCustomerDoc.id, createdCustomerDoc.data());
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

/**
 * Update a customer
 */
export const updateCustomer = async (
  id: string,
  data: Partial<Customer>
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
    if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;
    if (data.segment !== undefined) updateData.segment = data.segment;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.userId !== undefined) updateData.userId = data.userId;

    // Update the customer
    await updateDoc(customerRef, updateData);

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

    // Build the query
    let ordersQuery = query(
      collection(db, ORDERS_COLLECTION),
      where('customerId', '==', customerId),
      orderBy('createdAt', sortDirection)
    );

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
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

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
    // Get all orders for the customer
    const ordersQuery = query(
      collection(db, ORDERS_COLLECTION),
      where('customerId', '==', customerId)
    );

    const snapshot = await getDocs(ordersQuery);

    // Calculate total spent
    let totalSpent = 0;
    snapshot.docs.forEach(doc => {
      const order = doc.data();
      totalSpent += order.total || 0;
    });

    // Update the customer with the calculated values
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
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
 * Create or update a customer from an order
 */
export const createOrUpdateCustomerFromOrder = async (
  orderData: {
    id: string;
    email: string;
    customerName?: string;
    shippingAddress?: any;
    total?: number;
    userId?: string;
    createdAt?: any;
  }
) => {
  try {
    // Check if a customer with this email already exists
    const existingCustomer = await getCustomerByEmail(orderData.email);
    
    if (existingCustomer) {
      // Update existing customer
      const customerRef = doc(db, CUSTOMERS_COLLECTION, existingCustomer.id);
      
      await updateDoc(customerRef, {
        lastOrderDate: orderData.createdAt || serverTimestamp(),
        totalOrders: increment(1),
        totalSpent: increment(orderData.total || 0),
        updatedAt: serverTimestamp()
      });
      
      // Update the order with the customer ID
      const orderRef = doc(db, ORDERS_COLLECTION, orderData.id);
      await updateDoc(orderRef, {
        customerId: existingCustomer.id,
        updatedAt: serverTimestamp()
      });
      
      return existingCustomer.id;
    } else {
      // Create a new customer
      const newCustomerData = {
        email: orderData.email,
        name: orderData.customerName || null,
        phone: orderData.shippingAddress?.phone || null,
        address: {
          street: orderData.shippingAddress?.address || null,
          city: orderData.shippingAddress?.city || null,
          state: orderData.shippingAddress?.state || null,
          zip: orderData.shippingAddress?.postalCode || null,
          country: orderData.shippingAddress?.country || null
        },
        userId: orderData.userId || null,
        notes: `Created from order ${orderData.id}`,
        isActive: true,
        emailVerified: false,
        segment: [],
        totalOrders: 1,
        totalSpent: orderData.total || 0,
        lastOrderDate: orderData.createdAt || serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Create the customer
      const customerRef = await addDoc(customersRef, newCustomerData);
      
      // Update the order with the customer ID
      const orderRef = doc(db, ORDERS_COLLECTION, orderData.id);
      await updateDoc(orderRef, {
        customerId: customerRef.id,
        updatedAt: serverTimestamp()
      });
      
      return customerRef.id;
    }
  } catch (error) {
    console.error('Error creating or updating customer from order:', error);
    throw error;
  }
};

/**
 * Get customer segments
 */
export const getCustomerSegments = async () => {
  try {
    const segmentsQuery = query(
      segmentsRef,
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(segmentsQuery);

    const segments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      criteria: doc.data().criteria || {}
    })) as CustomerSegment[];

    return segments;
  } catch (error) {
    console.error('Error getting customer segments:', error);
    throw error;
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

    // Get the current segment data
    const segmentDoc = await getDoc(segmentRef);

    if (!segmentDoc.exists()) {
      throw new Error('Segment not found');
    }

    // Prepare the update data
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
    // First, remove this segment from all customers
    const customersQuery = query(
      customersRef,
      where('segment', 'array-contains', id)
    );

    const snapshot = await getDocs(customersQuery);

    // Use a batch to update all customers
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
      const customerData = doc.data();
      const segments = customerData.segment || [];
      const updatedSegments = segments.filter((s: string) => s !== id);

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
        const segments = customerData.segment || [];

        // Only add the segment if it's not already there
        if (!segments.includes(segmentId)) {
          batch.update(customerRef, {
            segment: [...segments, segmentId],
            updatedAt: serverTimestamp()
          });
        }
      }
    }

    // Commit the batch
    await batch.commit();

    // Update the segment's customer count
    const customersQuery = query(
      customersRef,
      where('segment', 'array-contains', segmentId)
    );

    const snapshot = await getDocs(customersQuery);

    await updateDoc(segmentRef, {
      customerCount: snapshot.docs.length,
      updatedAt: serverTimestamp()
    });

    return { success: true, count: snapshot.docs.length };
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

    // Update each customer
    for (const customerId of customerIds) {
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
      const customerDoc = await getDoc(customerRef);

      if (customerDoc.exists()) {
        const customerData = customerDoc.data();
        const segments = customerData.segment || [];

        // Remove the segment
        const updatedSegments = segments.filter((s: string) => s !== segmentId);

        batch.update(customerRef, {
          segment: updatedSegments,
          updatedAt: serverTimestamp()
        });
      }
    }

    // Commit the batch
    await batch.commit();

    // Update the segment's customer count
    const customersQuery = query(
      customersRef,
      where('segment', 'array-contains', segmentId)
    );

    const snapshot = await getDocs(customersQuery);

    await updateDoc(segmentRef, {
      customerCount: snapshot.docs.length,
      updatedAt: serverTimestamp()
    });

    return { success: true, count: snapshot.docs.length };
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

    // Convert the documents to Customer objects
    const customers = snapshot.docs.map(doc =>
      convertToCustomer(doc.id, doc.data())
    );

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

    // Get segment distribution
    const segmentsQuery = query(segmentsRef);
    const segmentsSnapshot = await getDocs(segmentsQuery);
    const segments = segmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      count: doc.data().customerCount || 0
    }));

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      averageCustomerValue,
      segments
    };
  } catch (error) {
    console.error('Error getting customer analytics:', error);
    throw error;
  }
};
