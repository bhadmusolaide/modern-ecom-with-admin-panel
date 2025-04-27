'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiEdit2, FiTrash2, FiCopy, FiPackage, FiTag, FiStar, FiCheck, FiX } from 'react-icons/fi';
import { Product } from '@/lib/types';

interface ProductGridViewProps {
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

export default function ProductGridView({
  products,
  categories,
  selectedProducts,
  onSelectProduct,
  onDelete,
  onDuplicate,
  duplicatingProductId,
  isProcessing,
  onInlineEdit
}: ProductGridViewProps) {
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
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th scope="col" className="sticky left-0 z-20 bg-gray-50 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  onChange={() => {}} // This will be handled by the parent component
                  disabled={isProcessing}
                />
              </div>
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Updated
            </th>
            <th scope="col" className="sticky right-0 z-20 bg-gray-50 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id} className={selectedProducts.includes(product.id) ? "bg-blue-50" : ""}>
              <td className="sticky left-0 z-10 bg-white px-2 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => onSelectProduct(product.id)}
                    disabled={isProcessing}
                  />
                </div>
              </td>
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
                      <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-500 text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
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
                      <div 
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                        onClick={() => onInlineEdit && handleInlineEditStart(product.id, 'name', product.name)}
                        title={onInlineEdit ? "Click to edit" : undefined}
                      >
                        {product.name}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {categories[product.category] || 'Unknown Category'}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {editingProduct?.id === product.id && editingProduct.field === 'price' ? (
                  <div className="flex items-center">
                    <input
                      type="number"
                      className="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                    className="text-sm text-gray-900 cursor-pointer"
                    onClick={() => onInlineEdit && handleInlineEditStart(product.id, 'price', product.price)}
                    title={onInlineEdit ? "Click to edit" : undefined}
                  >
                    ${product.price}
                    {product.isSale && product.salePrice && (
                      <div className="text-sm text-red-600">${product.salePrice}</div>
                    )}
                  </div>
                )}
              </td>
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
              <td className="px-4 py-4 whitespace-nowrap">
                {editingProduct?.id === product.id && editingProduct.field === 'stock' && product.trackInventory ? (
                  <div className="flex items-center">
                    <input
                      type="number"
                      className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                    className={`text-sm ${product.trackInventory ? 'cursor-pointer' : ''}`}
                    onClick={() => product.trackInventory && onInlineEdit && handleInlineEditStart(product.id, 'stock', product.stock || 0)}
                    title={product.trackInventory && onInlineEdit ? "Click to edit" : undefined}
                  >
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
                      <span className="text-gray-500">Not tracked</span>
                    )}
                  </div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {product.updatedAt ? (
                    new Date(product.updatedAt).toLocaleDateString()
                  ) : product.createdAt ? (
                    new Date(product.createdAt).toLocaleDateString()
                  ) : (
                    'Unknown'
                  )}
                </div>
              </td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}