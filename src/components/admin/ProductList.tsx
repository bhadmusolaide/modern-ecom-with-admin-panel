'use client';

import React from 'react';
import { Product } from '@/lib/types';
import EnhancedProductList from './products/EnhancedProductList';

export type SortField = 'name' | 'price' | 'createdAt' | 'updatedAt' | 'stock';
export type SortDirection = 'asc' | 'desc';

interface ProductListProps {
  products: Product[];
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkUpdate?: (ids: string[], data: Partial<Product>) => Promise<void>;
  onSort?: (field: SortField, direction: SortDirection) => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
}

// This is a wrapper component that uses the new EnhancedProductList
// It maintains backward compatibility with existing code
export default function ProductList({ 
  products, 
  onDelete,
  onBulkDelete,
  onBulkUpdate,
  onSort,
  sortField = 'name',
  sortDirection = 'asc'
}: ProductListProps) {
  // Simply pass all props to the EnhancedProductList component
  return (
    <EnhancedProductList
      products={products}
      onDelete={onDelete}
      onBulkDelete={onBulkDelete}
      onBulkUpdate={onBulkUpdate}
      onSort={onSort}
      sortField={sortField}
      sortDirection={sortDirection}
    />
  );
}