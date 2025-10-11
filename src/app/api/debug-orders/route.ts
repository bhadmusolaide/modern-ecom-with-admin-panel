/**
 * Debug Orders API Route
 *
 * This API route helps debug order creation and customer creation issues.
 * Use this to troubleshoot problems with the order/customer sync process.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { createCustomerFromOrder } from '@/lib/firebase/createCustomerFromOrder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, action } = body;

    console.log('Debug API: Received request:', { orderId, action });

    if (action === 'create_customer' && orderId) {
      console.log('Debug API: Creating customer for order:', orderId);

      try {
        const customerId = await createCustomerFromOrder(orderId);
        console.log('Debug API: Customer created successfully:', customerId);

        return NextResponse.json({
          success: true,
          customerId,
          message: 'Customer created successfully'
        });
      } catch (error) {
        console.error('Debug API: Customer creation failed:', error);

        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        });
      }
    }

    if (action === 'check_order' && orderId) {
      console.log('Debug API: Checking order:', orderId);

      try {
        const db = getAdminFirestore();
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
          return NextResponse.json({
            success: false,
            error: 'Order not found'
          });
        }

        const orderData = orderDoc.data();
        console.log('Debug API: Order data:', orderData);

        return NextResponse.json({
          success: true,
          order: {
            id: orderDoc.id,
            ...orderData,
            customerId: orderData?.customerId || 'NOT SET'
          }
        });
      } catch (error) {
        console.error('Debug API: Error checking order:', error);

        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (action === 'check_customer' && body.email) {
      console.log('Debug API: Checking customer by email:', body.email);

      try {
        const db = getAdminFirestore();
        const customersRef = db.collection('customers');
        const q = customersRef.where('email', '==', body.email).limit(1);
        const snapshot = await q.get();

        if (snapshot.empty) {
          return NextResponse.json({
            success: true,
            found: false,
            message: 'No customer found with this email'
          });
        }

        const customerDoc = snapshot.docs[0];
        const customerData = customerDoc.data();

        return NextResponse.json({
          success: true,
          found: true,
          customer: {
            id: customerDoc.id,
            ...customerData
          }
        });
      } catch (error) {
        console.error('Debug API: Error checking customer:', error);

        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (action === 'diagnose_database') {
      console.log('Debug API: Running database diagnosis...');

      try {
        const db = getAdminFirestore();

        // Check orders collection
        const ordersRef = db.collection('orders');
        const ordersSnapshot = await ordersRef.limit(5).get();

        const ordersInfo = {
          count: ordersSnapshot.docs.length,
          orders: ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            email: doc.data().email,
            customerName: doc.data().customerName,
            customerId: doc.data().customerId || 'NOT SET',
            createdAt: doc.data().createdAt
          }))
        };

        // Check customers collection
        const customersRef = db.collection('customers');
        const customersSnapshot = await customersRef.limit(10).get();

        const customersInfo = {
          count: customersSnapshot.docs.length,
          customers: customersSnapshot.docs.map(doc => ({
            id: doc.id,
            email: doc.data().email,
            name: doc.data().name,
            totalOrders: doc.data().totalOrders,
            isActive: doc.data().isActive
          }))
        };

        // Check for orphaned orders
        const orphanedOrdersQuery = ordersRef.where('customerId', '==', null).limit(5);
        const orphanedSnapshot = await orphanedOrdersQuery.get();

        const orphanedOrdersInfo = {
          count: orphanedSnapshot.docs.length,
          orders: orphanedSnapshot.docs.map(doc => ({
            id: doc.id,
            email: doc.data().email,
            customerName: doc.data().customerName
          }))
        };

        return NextResponse.json({
          success: true,
          diagnosis: {
            orders: ordersInfo,
            customers: customersInfo,
            orphanedOrders: orphanedOrdersInfo,
            timestamp: new Date().toISOString()
          }
        });

      } catch (error) {
        console.error('Debug API: Database diagnosis failed:', error);

        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        });
      }
    }

    if (action === 'test_admin_customers_api') {
      console.log('Debug API: Testing admin customers API...');

      try {
        const response = await fetch('http://localhost:3000/api/admin/customers', {
          method: 'GET',
          headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || ''
          }
        });

        const result = await response.text();
        console.log('Debug API: Admin customers API response status:', response.status);
        console.log('Debug API: Admin customers API response:', result.substring(0, 500));

        return NextResponse.json({
          success: true,
          status: response.status,
          response: result,
          isAuthenticated: response.status !== 401
        });

      } catch (error) {
        console.error('Debug API: Error testing admin customers API:', error);

        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Supported actions: create_customer, check_order, check_customer, diagnose_database, test_admin_customers_api'
    });

  } catch (error) {
    console.error('Debug API: Unhandled error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
}