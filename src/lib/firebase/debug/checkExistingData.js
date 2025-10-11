/**
 * Diagnostic Script: Check Existing Database Data
 *
 * This script helps debug what's actually in the Firebase database
 * Run this in the browser console or as a Node.js script to inspect the data
 */

import { getAdminFirestore } from '../admin.ts';

export async function diagnoseDatabaseIssues() {
  try {
    console.log('🔍 Starting database diagnosis...');
    const db = getAdminFirestore();

    // Check orders collection
    console.log('\n📦 Checking orders collection...');
    const ordersRef = db.collection('orders');
    const ordersSnapshot = await ordersRef.limit(5).get();

    console.log(`Found ${ordersSnapshot.docs.length} recent orders:`);
    ordersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- Order ${doc.id}:`, {
        email: data.email,
        customerName: data.customerName,
        customerId: data.customerId || 'NOT SET',
        createdAt: data.createdAt,
        total: data.total
      });
    });

    // Check customers collection
    console.log('\n👥 Checking customers collection...');
    const customersRef = db.collection('customers');
    const customersSnapshot = await customersRef.limit(10).get();

    console.log(`Found ${customersSnapshot.docs.length} customers:`);
    customersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- Customer ${doc.id}:`, {
        email: data.email,
        name: data.name,
        totalOrders: data.totalOrders,
        isActive: data.isActive,
        createdAt: data.createdAt
      });
    });

    // Check for orphaned orders (orders without customers)
    console.log('\n🔍 Looking for orders without customers...');
    const ordersWithoutCustomersQuery = ordersRef
      .where('customerId', '==', null)
      .limit(5);

    const orphanedOrdersSnapshot = await ordersWithoutCustomersQuery.get();
    console.log(`Found ${orphanedOrdersSnapshot.docs.length} orders without customers`);

    if (orphanedOrdersSnapshot.docs.length > 0) {
      console.log('Sample orphaned orders:');
      orphanedOrdersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`- Order ${doc.id}: ${data.email} - ${data.customerName} - customerId: ${data.customerId}`);
      });
    }

    return {
      ordersCount: ordersSnapshot.docs.length,
      customersCount: customersSnapshot.docs.length,
      orphanedOrdersCount: orphanedOrdersSnapshot.docs.length
    };

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    throw error;
  }
}

// Export for use in other contexts
export { diagnoseDatabaseIssues };

// For direct execution
if (typeof window !== 'undefined') {
  // Browser context
  window.diagnoseDatabaseIssues = diagnoseDatabaseIssues;
  console.log('💡 Run diagnoseDatabaseIssues() in the console to check your database');
}