/**
 * Order Data Access Layer Tests
 * 
 * This file contains tests for the order data access layer functions.
 * Run these tests to verify that the order CRUD operations work correctly.
 */

import {
  createOrder,
  getOrderById,
  getOrderByOrderNumber,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  addOrderNote,
  getOrders,
  getOrdersByUser,
  getRecentOrders,
  getOrdersByStatus,
  getOrdersByDateRange,
  updateOrderPaymentStatus,
  addOrderTracking,
  getOrderCountsByStatus,
  getTotalSales,
  markOrderAsDelivered,
  cancelOrder
} from '../orders';

import {
  Order,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShippingAddress,
  ShippingMethod
} from '../../types';

/**
 * Test creating a new order
 */
async function testCreateOrder() {
  console.log('Testing createOrder...');
  
  try {
    // Create a sample order
    const shippingAddress: ShippingAddress = {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'US',
      phone: '555-123-4567'
    };
    
    const shippingMethod: ShippingMethod = {
      id: 'standard',
      name: 'Standard Shipping',
      price: 5.99,
      estimatedDelivery: '3-5 business days'
    };
    
    const newOrder = await createOrder({
      email: 'john.doe@example.com',
      status: OrderStatus.PENDING,
      items: [
        {
          id: 'item1',
          productId: 'product1',
          name: 'Test Product 1',
          price: 19.99,
          quantity: 2,
          image: 'https://example.com/image1.jpg',
          subtotal: 39.98
        }
      ],
      customerName: 'John Doe',
      shippingAddress,
      subtotal: 39.98,
      tax: 3.20,
      shippingCost: 5.99,
      total: 49.17,
      shippingMethod,
      payment: {
        method: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
        amount: 49.17,
        currency: 'USD'
      },
      isGuestOrder: true,
      requiresShipping: true
    });
    
    console.log('Order created successfully:', newOrder);
    return newOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Test getting an order by ID
 */
async function testGetOrderById(orderId: string) {
  console.log(`Testing getOrderById with ID ${orderId}...`);
  
  try {
    const order = await getOrderById(orderId);
    console.log('Order retrieved successfully:', order);
    return order;
  } catch (error) {
    console.error('Error getting order by ID:', error);
    throw error;
  }
}

/**
 * Test getting an order by order number
 */
async function testGetOrderByOrderNumber(orderNumber: string) {
  console.log(`Testing getOrderByOrderNumber with number ${orderNumber}...`);
  
  try {
    const order = await getOrderByOrderNumber(orderNumber);
    console.log('Order retrieved successfully:', order);
    return order;
  } catch (error) {
    console.error('Error getting order by order number:', error);
    throw error;
  }
}

/**
 * Test updating an order
 */
async function testUpdateOrder(orderId: string) {
  console.log(`Testing updateOrder with ID ${orderId}...`);
  
  try {
    const updatedOrder = await updateOrder(orderId, {
      status: OrderStatus.PROCESSING,
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address: '456 Updated St',
        city: 'Newtown',
        state: 'CA',
        postalCode: '54321',
        country: 'US',
        phone: '555-987-6543'
      }
    });
    
    console.log('Order updated successfully:', updatedOrder);
    return updatedOrder;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

/**
 * Test updating order status
 */
async function testUpdateOrderStatus(orderId: string) {
  console.log(`Testing updateOrderStatus with ID ${orderId}...`);
  
  try {
    const updatedOrder = await updateOrderStatus(
      orderId,
      OrderStatus.SHIPPED,
      {
        message: 'Order has been shipped via UPS',
        createdBy: 'admin',
        isCustomerVisible: true
      }
    );
    
    console.log('Order status updated successfully:', updatedOrder);
    return updatedOrder;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Test adding a note to an order
 */
async function testAddOrderNote(orderId: string) {
  console.log(`Testing addOrderNote with ID ${orderId}...`);
  
  try {
    const updatedOrder = await addOrderNote(
      orderId,
      {
        message: 'Customer requested expedited shipping',
        createdBy: 'admin',
        isCustomerVisible: false
      }
    );
    
    console.log('Order note added successfully:', updatedOrder);
    return updatedOrder;
  } catch (error) {
    console.error('Error adding order note:', error);
    throw error;
  }
}

/**
 * Test getting orders with filters
 */
async function testGetOrders() {
  console.log('Testing getOrders...');
  
  try {
    const result = await getOrders(
      { status: OrderStatus.PROCESSING },
      { pageSize: 10 }
    );
    
    console.log('Orders retrieved successfully:', result);
    return result;
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
}

/**
 * Test getting orders by user
 */
async function testGetOrdersByUser(userId: string) {
  console.log(`Testing getOrdersByUser with user ID ${userId}...`);
  
  try {
    const result = await getOrdersByUser(userId);
    console.log('User orders retrieved successfully:', result);
    return result;
  } catch (error) {
    console.error('Error getting orders by user:', error);
    throw error;
  }
}

/**
 * Test getting recent orders
 */
async function testGetRecentOrders() {
  console.log('Testing getRecentOrders...');
  
  try {
    const orders = await getRecentOrders(5);
    console.log('Recent orders retrieved successfully:', orders);
    return orders;
  } catch (error) {
    console.error('Error getting recent orders:', error);
    throw error;
  }
}

/**
 * Test deleting an order
 */
async function testDeleteOrder(orderId: string) {
  console.log(`Testing deleteOrder with ID ${orderId}...`);
  
  try {
    const result = await deleteOrder(orderId);
    console.log('Order deleted successfully:', result);
    return result;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}

/**
 * Run all tests
 */
export async function runOrderTests() {
  try {
    // Create a new order
    const newOrder = await testCreateOrder();
    
    if (!newOrder) {
      throw new Error('Failed to create order');
    }
    
    // Get the order by ID
    await testGetOrderById(newOrder.id);
    
    // Get the order by order number
    await testGetOrderByOrderNumber(newOrder.orderNumber);
    
    // Update the order
    await testUpdateOrder(newOrder.id);
    
    // Update order status
    await testUpdateOrderStatus(newOrder.id);
    
    // Add a note to the order
    await testAddOrderNote(newOrder.id);
    
    // Get orders with filters
    await testGetOrders();
    
    // Get recent orders
    await testGetRecentOrders();
    
    // Delete the order (cleanup)
    await testDeleteOrder(newOrder.id);
    
    console.log('All order tests completed successfully!');
  } catch (error) {
    console.error('Error running order tests:', error);
  }
}

// Uncomment to run tests
// runOrderTests();