'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/context/ToastContext';
import ProductForm from '@/components/admin/ProductForm';
import { collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function NewProductPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (product: any) => {
    try {
      // Create the product without an id field first
      const { id, ...productWithoutId } = product;

      // Add the document to Firestore
      const docRef = await addDoc(collection(db, 'products'), {
        ...productWithoutId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update the document to set its id field to match its document ID
      await updateDoc(docRef, {
        id: docRef.id
      });

      showToast('Product created successfully', 'success');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Add New Product</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Create a new product for your store
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <ProductForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}