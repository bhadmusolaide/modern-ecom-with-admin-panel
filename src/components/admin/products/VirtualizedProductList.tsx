'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { FiEdit2, FiTrash2, FiCopy, FiPackage, FiTag, FiStar } from 'react-icons/fi';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedProductListProps {
  products: Product[];
  categories: { [key: string]: string };
  selectedProducts: string[];
  onSelectProduct: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  duplicatingProductId: string | null;
  isProcessing: boolean;
  visibleColumns: string[];
}

export default function VirtualizedProductList({
  products,
  categories,
  selectedProducts,
  onSelectProduct,
  onDelete,
  onDuplicate,
  duplicatingProductId,
  isProcessing,
  visibleColumns
}: VirtualizedProductListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Handle scroll event
  const handleScroll = useCallback(() => {
    if (parentRef.current) {
      setScrollTop(parentRef.current.scrollTop);
    }
  }, []);

  // Set up the virtualizer
  const rowVirtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5, // Number of items to render outside of the visible area
  });

  // Get virtualized rows
  const virtualRows = rowVirtualizer.getVirtualItems();

  // Calculate total list height
  const totalHeight = rowVirtualizer.getTotalSize();

  // Calculate if a column is visible
  const isColumnVisible = (columnId: string) => visibleColumns.includes(columnId);

  return (
    <div
      ref={parentRef}
      className="overflow-auto max-h-[70vh] relative"
      onScroll={handleScroll}
    >
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50 sticky top-0 z-10">
          <tr>
            {isColumnVisible('checkbox') && (
              <th scope="col" className="sticky left-0 z-20 bg-neutral-50 px-2 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    onChange={() => {}} // This will be handled by the parent component
                    disabled={isProcessing}
                  />
                </div>
              </th>
            )}
            {isColumnVisible('product') && (
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Product
              </th>
            )}
            {isColumnVisible('category') && (
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Category
              </th>
            )}
            {isColumnVisible('price') && (
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Price
              </th>
            )}
            {isColumnVisible('status') && (
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
            )}
            {isColumnVisible('stock') && (
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Stock
              </th>
            )}
            {isColumnVisible('updated') && (
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Updated
              </th>
            )}
            {isColumnVisible('actions') && (
              <th scope="col" className="sticky right-0 z-20 bg-neutral-50 px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200 relative">
          {/* Spacer element to create the illusion of scrolling */}
          <tr style={{ height: `${totalHeight}px` }} className="absolute top-0 left-0 w-full">
            <td></td>
          </tr>

          {/* Virtualized rows */}
          {virtualRows.map(virtualRow => {
            const product = products[virtualRow.index];
            return (
              <tr
                key={product.id}
                className={`absolute top-0 left-0 w-full ${selectedProducts.includes(product.id) ? "bg-blue-50" : ""}`}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                {isColumnVisible('checkbox') && (
                  <td className="sticky left-0 z-10 bg-white px-2 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => onSelectProduct(product.id)}
                        disabled={isProcessing}
                      />
                    </div>
                  </td>
                )}
                {isColumnVisible('product') && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 relative flex-shrink-0">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-neutral-200 rounded-md flex items-center justify-center">
                            <span className="text-neutral-500 text-xs">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                )}
                {isColumnVisible('category') && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {categories[product.category] || 'Unknown Category'}
                    </div>
                  </td>
                )}
                {isColumnVisible('price') && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      ${product.price}
                      {product.isSale && product.salePrice && (
                        <div className="text-sm text-red-600">${product.salePrice}</div>
                      )}
                    </div>
                  </td>
                )}
                {isColumnVisible('status') && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {product.isNew && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <FiPackage className="mr-1 h-3 w-3 mt-0.5" /> New
                        </span>
                      )}
                      {product.isSale && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <FiTag className="mr-1 h-3 w-3 mt-0.5" /> Sale
                        </span>
                      )}
                      {product.isFeatured && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          <FiStar className="mr-1 h-3 w-3 mt-0.5" /> Featured
                        </span>
                      )}
                    </div>
                  </td>
                )}
                {isColumnVisible('stock') && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {product.trackInventory ? (
                        typeof product.stock === 'number' ? (
                          product.stock <= 0 ? (
                            <span className="text-red-600">{product.stock} (Out of stock)</span>
                          ) : product.stock <= (product.lowStockThreshold || 5) ? (
                            <span className="text-yellow-600">{product.stock} (Low)</span>
                          ) : (
                            <span className="text-green-600">{product.stock}</span>
                          )
                        ) : 'N/A'
                      ) : (
                        <span className="text-neutral-500">Not tracked</span>
                      )}
                    </div>
                  </td>
                )}
                {isColumnVisible('updated') && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-500">
                      {product.updatedAt ? (
                        new Date(product.updatedAt).toLocaleDateString()
                      ) : product.createdAt ? (
                        new Date(product.createdAt).toLocaleDateString()
                      ) : (
                        'Unknown'
                      )}
                    </div>
                  </td>
                )}
                {isColumnVisible('actions') && (
                  <td className="sticky right-0 z-10 bg-white px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit product"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => onDuplicate(product.id)}
                        className="text-blue-600 hover:text-blue-900"
                        disabled={duplicatingProductId === product.id}
                        title="Duplicate product"
                      >
                        {duplicatingProductId === product.id ? (
                          <div className="h-5 w-5 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin" />
                        ) : (
                          <FiCopy className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete product"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}