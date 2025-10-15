/**
 * Admin Utility: Create Customers for Orders
 *
 * This utility helps create customer records for orders that failed
 * to create customers during the order creation process.
 */

import { getAdminFirestore } from '../admin';

/**
 * Find orders without customer records and create customers for them
 */
export async function createCustomersForOrdersWithoutCustomers(options: {
  limit?: number;
  dryRun?: boolean;
} = {}): Promise<{
  processed: number;
  created: number;
  failed: number;
  errors: Array<{ orderId: string; error: string }>;
}> {
  const { limit = 50, dryRun = false } = options;
  const result = { processed: 0, created: 0, failed: 0, errors: [] as Array<{ orderId: string; error: string }> };

  const adminDb = getAdminFirestore();

  try {
    const ordersSnap = await adminDb
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    for (const doc of ordersSnap.docs) {
      result.processed++;
      const order: any = { id: doc.id, ...doc.data() };

      if (order.customerId) {

        continue;
      }

      if (dryRun) {

        result.created++;
        continue;
      }

      try {
        const customersCol = adminDb.collection('customers');
        const email = order.email;

        let customerId: string;
        const existing = await customersCol.where('email', '==', email).limit(1).get();
        if (!existing.empty) {
          const c = existing.docs[0];
          customerId = c.id;
          const data = c.data() || {};
          await customersCol.doc(customerId).update({
            lastOrderDate: new Date(),
            totalOrders: (data.totalOrders || 0) + 1,
            totalSpent: (data.totalSpent || 0) + (order.total || 0),
            ...(data.userId ? {} : (order.userId ? { userId: order.userId } : {})),
            updatedAt: new Date()
          });
        } else {
          const ref = await customersCol.add({
            email: order.email,
            name: order.customerName || null,
            phone: order.shippingAddress?.phone || null,
            address: {
              street: order.shippingAddress?.address || null,
              city: order.shippingAddress?.city || null,
              state: order.shippingAddress?.state || null,
              zip: order.shippingAddress?.postalCode || null,
              country: order.shippingAddress?.country || null,
              phone: order.shippingAddress?.phone || null,
            },
            userId: order.userId || null,
            notes: `Created from order ${order.orderNumber || order.id}`,
            isActive: true,
            emailVerified: false,
            segment: [],
            totalOrders: 1,
            totalSpent: order.total || 0,
            lastOrderDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          customerId = ref.id;
        }

        await adminDb.collection('orders').doc(order.id).update({
          customerId,
          isGuestOrder: false,
          updatedAt: new Date().toISOString(),
        });

        result.created++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`❌ Failed linking order ${order.id}: ${msg}`);
        result.failed++;
        result.errors.push({ orderId: order.id, error: msg });
      }
    }

    return result;
  } catch (error) {
    console.error('Error in createCustomersForOrdersWithoutCustomers:', error);
    throw error;
  }
}

/**
 * Create customer for a specific order
 */
export async function createCustomerForSpecificOrder(orderId: string): Promise<string> {
  const adminDb = getAdminFirestore();
  try {
    const doc = await adminDb.collection('orders').doc(orderId).get();
    if (!doc.exists) throw new Error(`Order with ID ${orderId} not found`);
    const order: any = { id: doc.id, ...doc.data() };
    if (order.customerId) throw new Error(`Order ${orderId} already has customerId: ${order.customerId}`);

    const customersCol = adminDb.collection('customers');
    const existing = await customersCol.where('email', '==', order.email).limit(1).get();
    let customerId: string;
    if (!existing.empty) {
      const c = existing.docs[0];
      customerId = c.id;
      const data = c.data() || {};
      await customersCol.doc(customerId).update({
        lastOrderDate: new Date(),
        totalOrders: (data.totalOrders || 0) + 1,
        totalSpent: (data.totalSpent || 0) + (order.total || 0),
        ...(data.userId ? {} : (order.userId ? { userId: order.userId } : {})),
        updatedAt: new Date()
      });
    } else {
      const ref = await customersCol.add({
        email: order.email,
        name: order.customerName || null,
        phone: order.shippingAddress?.phone || null,
        address: {
          street: order.shippingAddress?.address || null,
          city: order.shippingAddress?.city || null,
          state: order.shippingAddress?.state || null,
          zip: order.shippingAddress?.postalCode || null,
          country: order.shippingAddress?.country || null,
          phone: order.shippingAddress?.phone || null,
        },
        userId: order.userId || null,
        notes: `Created from order ${order.orderNumber || order.id}`,
        isActive: true,
        emailVerified: false,
        segment: [],
        totalOrders: 1,
        totalSpent: order.total || 0,
        lastOrderDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      customerId = ref.id;
    }

    await adminDb.collection('orders').doc(orderId).update({
      customerId,
      isGuestOrder: false,
      updatedAt: new Date().toISOString(),
    });

    return customerId;
  } catch (error) {
    console.error(`Failed to create customer for order ${orderId}:`, error);
    throw error;
  }
}