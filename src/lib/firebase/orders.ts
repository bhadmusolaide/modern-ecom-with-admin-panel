/**
 * Order Data Access Layer
 *
 * This module provides functions for creating, reading, updating, and deleting orders in Firebase Firestore.
 * It includes functions for querying orders by various criteria and handling order status changes.
 */

import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, endBefore,
  serverTimestamp, Timestamp, DocumentReference, DocumentData,
  QueryDocumentSnapshot, writeBatch, setDoc
} from 'firebase/firestore';
import { db } from './config';
import {
  Order, OrderStatus, OrderItem, ShippingAddress,
  ShippingMethod, PaymentInfo, OrderNote, PaymentStatus, PaymentMethod
} from '../types';
import { generateOrderNumber } from '../utils';
import { createCustomerFromOrder } from './createCustomerFromOrder';

// Collection reference
const ORDERS_COLLECTION = 'orders';
const ordersRef = collection(db, ORDERS_COLLECTION);

// Import admin Firestore for server-side operations that bypass security rules
import { getAdminFirestore } from './admin';

/**
 * Interface for pagination options
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
  minTotal?: number;
  maxTotal?: number;
  email?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'total' | 'status';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Create a new order
 * @param orderData Order data without id, orderNumber, createdAt, and updatedAt
 * @returns The created order with id, orderNumber, createdAt, and updatedAt
 */
export async function createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  try {
    console.log('Firebase createOrder: Starting order creation process');

    // Generate order number
    const orderNumber = generateOrderNumber();
    console.log('Firebase createOrder: Generated order number:', orderNumber);

    // Prepare order data with timestamps
    const now = new Date().toISOString();
    const newOrderData = {
      ...orderData,
      orderNumber,
      createdAt: now,
      updatedAt: now,
      status: orderData.status || OrderStatus.PENDING,
      payment: {
        ...orderData.payment,
        status: orderData.payment?.status || PaymentStatus.PENDING
      }
    };

    console.log('Firebase createOrder: Prepared order data with timestamps');
    console.log('Firebase createOrder: Collection path:', ordersRef.path);

    // Add order to Firestore
    console.log('Firebase createOrder: Adding document to Firestore...');
    const docRef = await addDoc(ordersRef, newOrderData);
    console.log('Firebase createOrder: Document added with ID:', docRef.id);

    // Create the order object
    const createdOrder = {
      id: docRef.id,
      ...newOrderData
    } as Order;

    // Create or update customer record for this order
    try {
      console.log('Firebase createOrder: Creating/updating customer record from order');
      // We don't await this to avoid blocking the order creation
      createCustomerFromOrder(docRef.id)
        .then(customerId => {
          console.log(`Firebase createOrder: Created/updated customer ${customerId} from order ${docRef.id}`);
        })
        .catch(error => {
          console.error(`Firebase createOrder: Error creating customer from order ${docRef.id}:`, error);
        });
    } catch (customerError) {
      console.error('Error initiating customer creation:', customerError);
      // Don't throw error here, just log it - we still want to return the order
    }

    console.log('Firebase createOrder: Returning created order with ID:', docRef.id);
    return createdOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Get an order by ID
 * @param orderId Order ID
 * @returns Order data or null if not found
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    console.log(`Firebase: Fetching order with ID: ${orderId}`);

    if (!orderId || typeof orderId !== 'string') {
      console.error(`Invalid order ID format: ${orderId}`);
      return null;
    }

    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    console.log(`Firebase: Order reference path: ${orderRef.path}`);

    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      console.log(`Firebase: Order with ID ${orderId} not found`);
      return null;
    }

    const orderData = orderDoc.data();
    console.log(`Firebase: Order data retrieved successfully for ID ${orderId}`);

    return {
      id: orderDoc.id,
      ...orderData
    } as Order;
  } catch (error) {
    console.error(`Error getting order with ID ${orderId}:`, error);
    throw error;
  }
}

/**
 * Get an order by order number
 * @param orderNumber Order number
 * @returns Order data or null if not found
 */
export async function getOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
  try {
    const q = query(ordersRef, where('orderNumber', '==', orderNumber), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const orderDoc = querySnapshot.docs[0];
    return {
      id: orderDoc.id,
      ...orderDoc.data()
    } as Order;
  } catch (error) {
    console.error(`Error getting order with order number ${orderNumber}:`, error);
    throw error;
  }
}

/**
 * Update an existing order
 * @param orderId Order ID
 * @param orderData Partial order data to update
 * @returns Updated order data
 */
export async function updateOrder(
  orderId: string,
  orderData: Partial<Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>>
): Promise<Order> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Update the order with new data and updated timestamp
    const updatedData = {
      ...orderData,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(orderRef, updatedData);

    // Get the updated order
    const updatedOrderDoc = await getDoc(orderRef);

    return {
      id: updatedOrderDoc.id,
      ...updatedOrderDoc.data()
    } as Order;
  } catch (error) {
    console.error(`Error updating order with ID ${orderId}:`, error);
    throw error;
  }
}

/**
 * Delete an order
 * @param orderId Order ID
 * @returns True if successful
 */
export async function deleteOrder(orderId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
    return true;
  } catch (error) {
    console.error(`Error deleting order with ID ${orderId}:`, error);
    throw error;
  }
}

/**
 * Update order status
 * @param orderId Order ID
 * @param status New order status
 * @param note Optional note to add with the status change
 * @returns Updated order
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: { message: string, createdBy: string, isCustomerVisible: boolean }
): Promise<Order> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    // Update status and timestamp
    batch.update(orderRef, {
      status,
      updatedAt: now
    });

    // Add note if provided
    if (note) {
      const currentOrder = orderDoc.data() as Order;
      const noteId = `note_${Date.now()}`;
      const newNote: OrderNote = {
        id: noteId,
        message: note.message,
        createdAt: now,
        createdBy: note.createdBy,
        isCustomerVisible: note.isCustomerVisible
      };

      const notes = currentOrder.notes || [];
      batch.update(orderRef, {
        notes: [...notes, newNote]
      });
    }

    await batch.commit();

    // Get the updated order
    const updatedOrderDoc = await getDoc(orderRef);

    return {
      id: updatedOrderDoc.id,
      ...updatedOrderDoc.data()
    } as Order;
  } catch (error) {
    console.error(`Error updating status for order with ID ${orderId}:`, error);
    throw error;
  }
}

/**
 * Add a note to an order
 * @param orderId Order ID
 * @param note Note data
 * @returns Updated order
 */
export async function addOrderNote(
  orderId: string,
  note: { message: string, createdBy: string, isCustomerVisible: boolean }
): Promise<Order> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const currentOrder = orderDoc.data() as Order;
    const now = new Date().toISOString();
    const noteId = `note_${Date.now()}`;

    const newNote: OrderNote = {
      id: noteId,
      message: note.message,
      createdAt: now,
      createdBy: note.createdBy,
      isCustomerVisible: note.isCustomerVisible
    };

    const notes = currentOrder.notes || [];

    await updateDoc(orderRef, {
      notes: [...notes, newNote],
      updatedAt: now
    });

    // Get the updated order
    const updatedOrderDoc = await getDoc(orderRef);

    return {
      id: updatedOrderDoc.id,
      ...updatedOrderDoc.data()
    } as Order;
  } catch (error) {
    console.error(`Error adding note to order with ID ${orderId}:`, error);
    throw error;
  }
}

/**
 * Get orders with filtering and pagination
 * @param filters Filter options
 * @param pagination Pagination options
 * @returns Query result with orders and pagination info
 */
export async function getOrders(
  filters: OrderFilterOptions = {},
  pagination?: OrderPaginationOptions,
  useAdminDb: boolean = true // Use admin DB by default to bypass security rules
) {
  try {
    console.log('Firebase getOrders: Starting query with filters:', JSON.stringify(filters, null, 2));

    // Use admin Firestore to bypass security rules if specified
    let dbToUse;
    try {
      if (useAdminDb) {
        dbToUse = getAdminFirestore();
        if (!dbToUse) {
          console.error('Firebase getOrders: Admin Firestore is null or undefined');
          throw new Error('Admin Firestore initialization failed');
        }
      } else {
        dbToUse = db;
      }
      console.log('Firebase getOrders: DB instance obtained successfully');
    } catch (dbError) {
      console.error('Firebase getOrders: Error getting Firestore instance:', dbError);
      // Fallback to client DB if admin DB fails
      console.log('Firebase getOrders: Falling back to client DB');
      dbToUse = db;
    }

    const ordersCollection = collection(dbToUse, ORDERS_COLLECTION);
    console.log('Firebase getOrders: Using admin DB?', useAdminDb);
    console.log('Firebase getOrders: Collection path:', ORDERS_COLLECTION);

    const constraints: any[] = [];

    // Apply filters
    if (filters.userId) {
      console.log('Firebase getOrders: Adding userId filter:', filters.userId);
      constraints.push(where('userId', '==', filters.userId));
    }

    if (filters.email) {
      console.log('Firebase getOrders: Adding email filter:', filters.email);
      constraints.push(where('email', '==', filters.email));
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        if (filters.status.length === 1) {
          console.log('Firebase getOrders: Adding single status filter:', filters.status[0]);
          constraints.push(where('status', '==', filters.status[0]));
        } else if (filters.status.length > 1) {
          console.log('Firebase getOrders: Adding multiple status filter:', filters.status);
          constraints.push(where('status', 'in', filters.status));
        }
      } else {
        console.log('Firebase getOrders: Adding status filter:', filters.status);
        constraints.push(where('status', '==', filters.status));
      }
    }

    if (filters.dateFrom) {
      console.log('Firebase getOrders: Adding dateFrom filter:', filters.dateFrom.toISOString());
      constraints.push(where('createdAt', '>=', filters.dateFrom.toISOString()));
    }

    if (filters.dateTo) {
      console.log('Firebase getOrders: Adding dateTo filter:', filters.dateTo.toISOString());
      constraints.push(where('createdAt', '<=', filters.dateTo.toISOString()));
    }

    // Note: search filter will be applied client-side after fetching the data

    // Apply sorting
    const sortField = filters.sortBy || 'createdAt';
    const sortDirection = filters.sortDirection || 'desc';
    console.log(`Firebase getOrders: Adding sort by ${sortField} ${sortDirection}`);
    constraints.push(orderBy(sortField, sortDirection));

    // Apply pagination
    if (pagination) {
      console.log('Firebase getOrders: Adding pagination with pageSize:', pagination.pageSize);
      constraints.push(limit(pagination.pageSize));

      if (pagination.startAfterDoc) {
        console.log('Firebase getOrders: Adding startAfter pagination');
        constraints.push(startAfter(pagination.startAfterDoc));
      }

      if (pagination.endBeforeDoc) {
        console.log('Firebase getOrders: Adding endBefore pagination');
        constraints.push(endBefore(pagination.endBeforeDoc));
      }
    }

    // Execute query
    console.log('Firebase getOrders: Executing query with constraints:', constraints.length);
    const q = query(ordersCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    console.log('Firebase getOrders: Query executed, document count:', querySnapshot.size);

    // Extract orders
    const orders = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    }) as Order[];

    console.log('Firebase getOrders: Extracted orders count:', orders.length);
    if (orders.length > 0) {
      console.log('Firebase getOrders: First order ID:', orders[0].id);
    }

    // Apply client-side filtering for total amount and search
    let filteredOrders = orders;

    // Filter by total amount if needed
    if (filters.minTotal !== undefined || filters.maxTotal !== undefined) {
      console.log('Firebase getOrders: Applying client-side total amount filtering');
      filteredOrders = filteredOrders.filter(order => {
        if (filters.minTotal !== undefined && order.total < filters.minTotal) {
          return false;
        }
        if (filters.maxTotal !== undefined && order.total > filters.maxTotal) {
          return false;
        }
        return true;
      });
      console.log('Firebase getOrders: After total filtering, orders count:', filteredOrders.length);
    }

    // Apply search filter if provided
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      console.log('Firebase getOrders: Applying client-side search filtering for term:', searchTerm);

      filteredOrders = filteredOrders.filter(order => {
        // Search in order number
        if (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // Search in customer name
        if (order.customerName && order.customerName.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // Search in email
        if (order.email && order.email.toLowerCase().includes(searchTerm)) {
          return true;
        }

        return false;
      });

      console.log('Firebase getOrders: After search filtering, orders count:', filteredOrders.length);
    }

    // Return orders and pagination info
    return {
      orders: filteredOrders,
      pagination: {
        firstDoc: querySnapshot.docs[0] || null,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        count: querySnapshot.size,
        isEmpty: querySnapshot.empty
      }
    };
  } catch (error) {
    console.error('Error getting orders:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');

    // Return empty result instead of throwing to prevent API crashes
    return {
      orders: [],
      pagination: {
        firstDoc: null,
        lastDoc: null,
        count: 0,
        isEmpty: true
      }
    };
  }
}

/**
 * Get orders for a specific user
 * @param userId User ID
 * @param pagination Pagination options
 * @returns Query result with orders and pagination info
 */
export async function getOrdersByUser(
  userId: string,
  pagination?: OrderPaginationOptions
) {
  return getOrders(
    { userId, sortBy: 'createdAt', sortDirection: 'desc' },
    pagination
  );
}

/**
 * Get recent orders
 * @param limit Maximum number of orders to return
 * @returns Array of recent orders
 */
export async function getRecentOrders(limit = 10) {
  const result = await getOrders(
    { sortBy: 'createdAt', sortDirection: 'desc' },
    { pageSize: limit }
  );
  return result.orders;
}

/**
 * Get orders by status
 * @param status Order status or array of statuses
 * @param pagination Pagination options
 * @returns Query result with orders and pagination info
 */
export async function getOrdersByStatus(
  status: OrderStatus | OrderStatus[],
  pagination?: OrderPaginationOptions
) {
  return getOrders(
    { status, sortBy: 'createdAt', sortDirection: 'desc' },
    pagination
  );
}

/**
 * Get orders by date range
 * @param dateFrom Start date
 * @param dateTo End date
 * @param pagination Pagination options
 * @returns Query result with orders and pagination info
 */
export async function getOrdersByDateRange(
  dateFrom: Date,
  dateTo: Date,
  pagination?: OrderPaginationOptions
) {
  return getOrders(
    { dateFrom, dateTo, sortBy: 'createdAt', sortDirection: 'desc' },
    pagination
  );
}

/**
 * Update order payment status
 * @param orderId Order ID
 * @param paymentInfo Payment information to update
 * @returns Updated order
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentInfo: Partial<PaymentInfo> | PaymentStatus,
  transactionId?: string
): Promise<Order> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const currentOrder = orderDoc.data() as Order;
    const now = new Date().toISOString();

    // Handle the case where paymentInfo is just a PaymentStatus enum value
    let paymentStatus: PaymentStatus;
    let updatedPayment: PaymentInfo;

    if (typeof paymentInfo === 'string') {
      paymentStatus = paymentInfo;
      updatedPayment = {
        ...currentOrder.payment,
        status: paymentStatus,
        ...(transactionId && { transactionId }),
        ...(paymentStatus === PaymentStatus.COMPLETED && { datePaid: now }),
        ...(paymentStatus === PaymentStatus.REFUNDED && { dateRefunded: now })
      };
    } else {
      // Handle the case where paymentInfo is a partial PaymentInfo object
      paymentStatus = paymentInfo.status || currentOrder.payment.status;
      updatedPayment = {
        ...currentOrder.payment,
        ...paymentInfo,
        ...(paymentStatus === PaymentStatus.COMPLETED && !paymentInfo.datePaid && { datePaid: now }),
        ...(paymentStatus === PaymentStatus.REFUNDED && !paymentInfo.dateRefunded && { dateRefunded: now })
      };
    }

    // Update order status based on payment status if needed
    let orderStatus = currentOrder.status;
    if (paymentStatus === PaymentStatus.COMPLETED && currentOrder.status === OrderStatus.PENDING) {
      orderStatus = OrderStatus.PROCESSING;
    } else if (paymentStatus === PaymentStatus.FAILED && currentOrder.status === OrderStatus.PENDING) {
      orderStatus = OrderStatus.ON_HOLD;
    } else if (paymentStatus === PaymentStatus.REFUNDED) {
      orderStatus = OrderStatus.REFUNDED;
    } else if (paymentStatus === PaymentStatus.PARTIALLY_REFUNDED) {
      // Keep the current order status for partial refunds
      orderStatus = currentOrder.status;
    }

    await updateDoc(orderRef, {
      payment: updatedPayment,
      status: orderStatus,
      updatedAt: now
    });

    // Get the updated order
    const updatedOrderDoc = await getDoc(orderRef);

    return {
      id: updatedOrderDoc.id,
      ...updatedOrderDoc.data()
    } as Order;
  } catch (error) {
    console.error(`Error updating payment status for order with ID ${orderId}:`, error);
    throw error;
  }
}

/**
 * Add tracking information to an order
 * @param orderId Order ID
 * @param trackingInfo Tracking information
 * @returns Updated order
 */
export async function addOrderTracking(
  orderId: string,
  trackingInfo: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
    shippedDate?: string;
    estimatedDeliveryDate?: string;
  }
): Promise<Order> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const now = new Date().toISOString();
    const shippedDate = trackingInfo.shippedDate || now;

    // Update tracking information and set status to shipped
    await updateDoc(orderRef, {
      trackingInfo: {
        ...trackingInfo,
        shippedDate
      },
      status: OrderStatus.SHIPPED,
      updatedAt: now
    });

    // Get the updated order
    const updatedOrderDoc = await getDoc(orderRef);

    return {
      id: updatedOrderDoc.id,
      ...updatedOrderDoc.data()
    } as Order;
  } catch (error) {
    console.error(`Error adding tracking to order with ID ${orderId}:`, error);
    throw error;
  }
}

/**
 * Get order count by status
 * @returns Object with counts for each status
 */
export async function getOrderCountsByStatus(): Promise<Record<OrderStatus, number>> {
  try {
    const querySnapshot = await getDocs(ordersRef);

    // Initialize counts object with all statuses set to 0
    const counts: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.PROCESSING]: 0,
      [OrderStatus.SHIPPED]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.REFUNDED]: 0,
      [OrderStatus.ON_HOLD]: 0,
      [OrderStatus.BACKORDERED]: 0
    };

    // Count orders by status
    querySnapshot.docs.forEach(doc => {
      const order = doc.data() as Order;
      if (order.status && counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    });

    return counts;
  } catch (error) {
    console.error('Error getting order counts by status:', error);
    throw error;
  }
}

/**
 * Get total sales amount for a date range
 * @param dateFrom Start date
 * @param dateTo End date
 * @returns Total sales amount
 */
export async function getTotalSales(dateFrom: Date, dateTo: Date): Promise<number> {
  try {
    const result = await getOrdersByDateRange(dateFrom, dateTo);

    // Calculate total sales from completed orders
    const totalSales = result.orders
      .filter(order =>
        order.payment.status === PaymentStatus.COMPLETED ||
        order.status === OrderStatus.DELIVERED ||
        order.status === OrderStatus.SHIPPED
      )
      .reduce((sum, order) => sum + order.total, 0);

    return totalSales;
  } catch (error) {
    console.error('Error calculating total sales:', error);
    throw error;
  }
}

/**
 * Mark an order as delivered
 * @param orderId Order ID
 * @returns Updated order
 */
export async function markOrderAsDelivered(orderId: string): Promise<Order> {
  return updateOrderStatus(orderId, OrderStatus.DELIVERED);
}

/**
 * Cancel an order
 * @param orderId Order ID
 * @param reason Cancellation reason
 * @param cancelledBy User who cancelled the order
 * @returns Updated order
 */
export async function cancelOrder(
  orderId: string,
  reason: string,
  cancelledBy: string
): Promise<Order> {
  return updateOrderStatus(
    orderId,
    OrderStatus.CANCELLED,
    {
      message: `Order cancelled: ${reason}`,
      createdBy: cancelledBy,
      isCustomerVisible: true
    }
  );
}

/**
 * Process a refund for an order
 * @param orderId Order ID
 * @param refundOptions Refund options
 * @returns Updated order
 */
export async function processRefund(
  orderId: string,
  refundOptions: {
    amount?: number;
    isFullRefund?: boolean;
    reason?: string;
    refundedBy: string;
  }
): Promise<Order> {
  try {
    const { amount, isFullRefund = true, reason = 'Customer requested refund', refundedBy } = refundOptions;

    // Get the order
    const order = await getOrderById(orderId);

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Verify the order has been paid
    if (order.payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Cannot refund an order that has not been paid');
    }

    // Calculate refund amount
    const refundAmount = isFullRefund ? order.total : (amount || order.total);

    // Update payment status
    const paymentStatus = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;

    await updateOrderPaymentStatus(orderId, {
      status: paymentStatus,
      refundAmount: refundAmount,
      dateRefunded: new Date().toISOString(),
    });

    // If it's a full refund, update the order status
    if (isFullRefund) {
      await updateOrderStatus(orderId, OrderStatus.REFUNDED);
    }

    // Add a note to the order
    await addOrderNote(
      orderId,
      {
        message: `Refund processed: ${isFullRefund ? 'Full' : 'Partial'} refund of ${refundAmount / 100} ${order.payment.currency}. Reason: ${reason}`,
        createdBy: refundedBy,
        isCustomerVisible: true
      }
    );

    // Get the updated order
    return getOrderById(orderId) as Promise<Order>;
  } catch (error) {
    console.error(`Error processing refund for order with ID ${orderId}:`, error);
    throw error;
  }
}