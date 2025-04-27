'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/context/ToastContext';
import ProductForm from '@/components/admin/ProductForm';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/lib/types';

export default function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = use(props.params);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) {
          showToast('Product ID is missing', 'error');
          router.push('/admin/products');
          return;
        }

        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        } else {
          showToast('Product not found', 'error');
          router.push('/admin/products');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        showToast('Error fetching product', 'error');
        router.push('/admin/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, router, showToast]);

  const handleSubmit = async (updatedProduct: Partial<Product>) => {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        ...updatedProduct,
        updatedAt: new Date().toISOString(),
      });
      showToast('Product updated successfully', 'success');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Edit Product</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Update product details
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <ProductForm product={product} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}