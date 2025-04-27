'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiEdit2, FiTrash2, FiCopy, FiPackage, FiTag, FiStar, FiCheck, FiX } from 'react-icons/fi';
import { Product } from '@/lib/types';

interface ProductCardViewProps {
  products: Product[];
  categories: { [key: string]: string };
  selectedProducts: string[];
  onSelectProduct: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  duplicatingProductId: string | null;
  isProcessing: boolean;
  onInlineEdit?: (id: string, field: string, value: any) => Promise<void>;
}

export default function ProductCardView({
  products,
  categories,
  selectedProducts,
  onSelectProduct,
  onDelete,
  onDuplicate,
  duplicatingProductId,
  isProcessing,
  onInlineEdit
}: ProductCardViewProps) {
  const [editingProduct, setEditingProduct] = useState<{id: string, field: string, value: any} | null>(null);

  const handleInlineEditStart = (id: string, field: string, value: any) => {
    if (!onInlineEdit) return;
    setEditingProduct({ id, field, value });
  };

  const handleInlineEditSave = async () => {
    if (!editingProduct || !onInlineEdit) return;
    
    try {
      await onInlineEdit(editingProduct.id, editingProduct.field, editingProduct.value);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving inline edit:', error);
    }
  };

  const handleInlineEditCancel = () => {
    setEditingProduct(null);
  };

  const handleInlineEditChange = (value: any) => {
    if (!editingProduct) return;
    setEditingProduct({ ...editingProduct, value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <div 
          key={product.id} 
          className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all duration-200 ${
            selectedProducts.includes(product.id) ? "ring-2 ring-primary-500" : "hover:shadow-md"
          }`}
        >
          <div className="relative">
            {/* Product Image */}
            <div className="h-48 w-full relative bg-gray-100">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            
            {/* Selection Checkbox */}
            <div className="absolute top-2 left-2">
              <input
                type="checkbox"
                className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={selectedProducts.includes(product.id)}
                onChange={() => onSelectProduct(product.id)}
                disabled={isProcessing}
              />
            </div>
            
            {/* Status Badges */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {product.isFeatured && (
                <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-blue-100 text-blue-800">
                  <FiStar className="mr-1 h-3 w-3 mt-0.5" /> Featured
                </span>
              )}
              {product.isNew && (
                <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-green-100 text-green-800">
                  <FiPackage className="mr-1 h-3 w-3 mt-0.5" /> New
                </span>
              )}
              {product.isSale && (
                <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-red-100 text-red-800">
                  <FiTag className="mr-1 h-3 w-3 mt-0.5" /> Sale
                </span>
              )}
            </div>
          </div>
          
          <div className="p-4">
            {/* Product Name */}
            <div className="mb-2">
              {editingProduct?.id === product.id && editingProduct.field === 'name' ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={editingProduct.value}
                    onChange={(e) => handleInlineEditChange(e.target.value)}
                    autoFocus
                  />
                  <button 
                    onClick={handleInlineEditSave}
                    className="ml-1 text-green-600 hover:text-green-900"
                  >
                    <FiCheck className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={handleInlineEditCancel}
                    className="ml-1 text-red-600 hover:text-red-900"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <h3 
                  className="text-sm font-medium text-gray-900 truncate hover:text-primary-600 cursor-pointer"
                  onClick={() => onInlineEdit && handleInlineEditStart(product.id, 'name', product.name)}
                  title={onInlineEdit ? "Click to edit" : undefined}
                >
                  {product.name}
                </h3>
              )}
            </div>
            
            {/* Category */}
            <div className="text-xs text-gray-500 mb-2">
              {categories[product.category] || 'Unknown Category'}
            </div>
            
            {/* Price */}
            <div className="flex items-center mb-2">
              {editingProduct?.id === product.id && editingProduct.field === 'price' ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={editingProduct.value}
                    onChange={(e) => handleInlineEditChange(parseFloat(e.target.value))}
                    step="0.01"
                    min="0"
                    autoFocus
                  />
                  <button 
                    onClick={handleInlineEditSave}
                    className="ml-1 text-green-600 hover:text-green-900"
                  >
                    <FiCheck className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={handleInlineEditCancel}
                    className="ml-1 text-red-600 hover:text-red-900"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div 
                  className="text-sm font-medium text-gray-900 cursor-pointer"
                  onClick={() => onInlineEdit && handleInlineEditStart(product.id, 'price', product.price)}
                  title={onInlineEdit ? "Click to edit" : undefined}
                >
                  ${product.price}
                  {product.isSale && product.salePrice && (
                    <span className="ml-2 text-red-600">${product.salePrice}</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Stock */}
            <div className="flex items-center mb-3">
              {editingProduct?.id === product.id && editingProduct.field === 'stock' ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={editingProduct.value}
                    onChange={(e) => handleInlineEditChange(parseInt(e.target.value, 10))}
                    step="1"
                    min="0"
                    autoFocus
                  />
                  <button 
                    onClick={handleInlineEditSave}
                    className="ml-1 text-green-600 hover:text-green-900"
                  >
                    <FiCheck className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={handleInlineEditCancel}
                    className="ml-1 text-red-600 hover:text-red-900"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div 
                  className="text-xs text-gray-500 cursor-pointer"
                  onClick={() => product.trackInventory && onInlineEdit && handleInlineEditStart(product.id, 'stock', product.stock || 0)}
                  title={product.trackInventory && onInlineEdit ? "Click to edit" : undefined}
                >
                  {product.trackInventory ? (
                    <>
                      <span className="font-medium">Stock:</span> {typeof product.stock === 'number' ? product.stock : 'N/A'}
                      {typeof product.stock === 'number' && product.stock <= (product.lowStockThreshold || 5) && product.stock > 0 && (
                        <span className="ml-1 text-yellow-600">(Low)</span>
                      )}
                      {typeof product.stock === 'number' && product.stock <= 0 && (
                        <span className="ml-1 text-red-600">(Out of stock)</span>
                      )}
                    </>
                  ) : (
                    <span>Stock not tracked</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {product.updatedAt ? (
                  `Updated: ${new Date(product.updatedAt).toLocaleDateString()}`
                ) : product.createdAt ? (
                  `Created: ${new Date(product.createdAt).toLocaleDateString()}`
                ) : (
                  'Unknown date'
                )}
              </div>
              <div className="flex space-x-2">
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}