'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { FiEdit2, FiTrash2, FiCopy, FiEye, FiTag, FiDollarSign, FiPackage } from 'react-icons/fi';
import Link from 'next/link';
import ResponsiveTable, { Column } from '@/components/ui/ResponsiveTable';
import ProxiedImage from '@/components/ui/ProxiedImage';
import Badge from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';

interface ResponsiveProductListProps {
  products: Product[];
  categories: { [key: string]: string };
  selectedProducts: string[];
  onSelectProduct: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  duplicatingProductId: string | null;
  isProcessing: boolean;
}

function ResponsiveProductList({
  products,
  categories,
  selectedProducts,
  onSelectProduct,
  onDelete,
  onDuplicate,
  duplicatingProductId,
  isProcessing
}: ResponsiveProductListProps) {
  // Define columns for the responsive table
  const columns: Column<Product>[] = [
    {
      header: '',
      accessor: 'id',
      cell: (product) => (
        <div className="flex items-center">
          <input
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            checked={selectedProducts.includes(product.id || '')}
            onChange={() => onSelectProduct(product.id || '')}
            disabled={isProcessing}
          />
        </div>
      ),
      className: 'w-10',
      priority: 'high'
    },
    {
      header: 'Product',
      accessor: 'name',
      cell: (product) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 mr-3">
            <ProxiedImage
              src={product.image || ''}
              alt={product.name || ''}
              width={40}
              height={40}
              className="h-10 w-10 rounded-md object-cover"
            />
          </div>
          <div>
            <div className="font-medium text-gray-900">{product.name}</div>
            <div className="text-xs text-gray-500">
              {product.sku ? `SKU: ${product.sku}` : 'No SKU'}
            </div>
          </div>
        </div>
      ),
      sortable: true,
      mobileLabel: 'Product',
      priority: 'high'
    },
    {
      header: 'Price',
      accessor: 'price',
      cell: (product) => (
        <div>
          {product.isSale && product.salePrice ? (
            <div>
              <span className="text-red-600 font-medium">{formatPrice(product.salePrice)}</span>
              <span className="text-gray-500 line-through ml-2 text-sm">{formatPrice(product.price)}</span>
            </div>
          ) : (
            <span className="font-medium">{formatPrice(product.price)}</span>
          )}
        </div>
      ),
      sortable: true,
      mobileLabel: 'Price',
      priority: 'high'
    },
    {
      header: 'Category',
      accessor: (product) => categories[product.category || ''] || 'Uncategorized',
      cell: (product) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {categories[product.category || ''] || 'Uncategorized'}
        </span>
      ),
      sortable: true,
      mobileLabel: 'Category',
      priority: 'medium'
    },
    {
      header: 'Stock',
      accessor: 'stock',
      cell: (product) => {
        if (!product.trackInventory) {
          return <span className="text-gray-500">Not tracked</span>;
        }

        const stock = product.stock || 0;
        const lowStock = product.lowStockThreshold || 5;

        if (stock <= 0) {
          return <span className="text-red-600 font-medium">Out of stock</span>;
        } else if (stock <= lowStock) {
          return <span className="text-orange-600 font-medium">Low stock ({stock})</span>;
        } else {
          return <span className="text-green-600 font-medium">In stock ({stock})</span>;
        }
      },
      sortable: true,
      mobileLabel: 'Stock',
      priority: 'medium'
    },
    {
      header: 'Status',
      accessor: (product) => {
        if (product.isNew) return 'New';
        if (product.isSale) return 'Sale';
        if (product.isFeatured) return 'Featured';
        return 'Active';
      },
      cell: (product) => (
        <div className="space-x-1">
          {product.isNew && (
            <Badge color="green">New</Badge>
          )}
          {product.isSale && (
            <Badge color="red">Sale</Badge>
          )}
          {product.isFeatured && (
            <Badge color="purple">Featured</Badge>
          )}
          {!product.isNew && !product.isSale && !product.isFeatured && (
            <Badge color="gray">Active</Badge>
          )}
        </div>
      ),
      sortable: true,
      mobileLabel: 'Status',
      priority: 'medium'
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (product) => (
        <div className="flex items-center space-x-3">
          <Link
            href={`/admin/products/${product.id}`}
            className="text-blue-600 hover:text-blue-900"
            title="Edit product"
          >
            <FiEdit2 className="h-5 w-5" />
          </Link>
          <Link
            href={`/shop/product/${product.id}`}
            className="text-green-600 hover:text-green-900"
            title="View product"
            target="_blank"
          >
            <FiEye className="h-5 w-5" />
          </Link>
          <button
            onClick={() => onDuplicate(product.id || '')}
            className="text-purple-600 hover:text-purple-900"
            title="Duplicate product"
            disabled={isProcessing || duplicatingProductId === product.id}
          >
            {duplicatingProductId === product.id ? (
              <span className="animate-pulse">Duplicating...</span>
            ) : (
              <FiCopy className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => onDelete(product.id || '')}
            className="text-red-600 hover:text-red-900"
            title="Delete product"
            disabled={isProcessing}
          >
            <FiTrash2 className="h-5 w-5" />
          </button>
        </div>
      ),
      className: 'text-right',
      mobileLabel: 'Actions',
      priority: 'high'
    }
  ];

  return (
    <ResponsiveTable
      data={products}
      columns={columns}
      keyField="id"
      onRowClick={(product) => window.location.href = `/admin/products/${product.id}`}
      emptyMessage="No products found"
      isLoading={isProcessing}
      mobileCardMode={true}
      className="rounded-lg shadow"
    />
  );
}

// Memoize the component for better performance
export default React.memo(ResponsiveProductList);
