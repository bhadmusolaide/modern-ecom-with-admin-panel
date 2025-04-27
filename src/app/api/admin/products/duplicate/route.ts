import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, addDoc, updateDoc, collection } from 'firebase/firestore';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // In a real application, you would check authentication here
    // For now, we'll skip authentication checks for simplicity

    // Parse request body
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get the product to duplicate
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get product data
    const productData = productSnap.data();

    // Create a new product with the same data but different ID and timestamps
    const newProductData = {
      ...productData,
      name: `${productData.name} (Copy)`,
      slug: `${productData.slug}-copy-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add the new product to Firestore
    const newProductRef = await addDoc(collection(db, 'products'), newProductData);

    // Update the document to set its id field to match its document ID
    await updateDoc(newProductRef, {
      id: newProductRef.id
    });

    return NextResponse.json({
      success: true,
      message: 'Product duplicated successfully',
      productId: newProductRef.id
    });
  } catch (error) {
    console.error('Error duplicating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}