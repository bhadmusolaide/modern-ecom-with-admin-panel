import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug API: Inspecting Firestore collections...');

    if (!db) {
      console.error('❌ Firebase db not available');
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    // Check orders collection
    const ordersRef = collection(db, 'orders');
    const ordersSnapshot = await getDocs(ordersRef);
    const ordersData = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Check products collection
    const productsRef = collection(db, 'products');
    const productsSnapshot = await getDocs(productsRef);
    const productsData = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Check users collection
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const usersData = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const debugInfo = {
      orders: {
        count: ordersData.length,
        documents: ordersData
      },
      products: {
        count: productsData.length,
        documents: productsData
      },
      users: {
        count: usersData.length,
        documents: usersData
      },
      timestamp: new Date().toISOString()
    };

    console.log('📊 Debug API Results:', {
      ordersCount: ordersData.length,
      productsCount: productsData.length,
      usersCount: usersData.length
    });

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('❌ Debug API Error:', error);
    return NextResponse.json({
      error: 'Failed to inspect Firestore',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}