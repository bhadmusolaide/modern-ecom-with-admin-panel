'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import ProductSearch from '@/components/admin/ProductSearch';
import Button from '@/components/ui/Button';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';

export default function ProductSearchPage() {
  const router = useRouter();

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mr-4"
            >
              <FiArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Product Search</h1>
          </div>
          
          <Button
            onClick={() => router.push('/admin/products/new')}
          >
            <FiPlus className="h-5 w-5 mr-2" />
            Add New Product
          </Button>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6">
          <ProductSearch />
        </div>
      </div>
    </AdminLayout>
  );
}