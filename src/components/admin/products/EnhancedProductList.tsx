'use client';

import React, { useState, useEffect, useMemo, lazy, Suspense, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/lib/types';
import { FiGrid, FiList, FiColumns, FiZap, FiSmartphone, FiPackage, FiTag, FiStar, FiEdit2, FiCopy, FiTrash2 } from 'react-icons/fi';
import { useToast } from '@/lib/context/ToastContext';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import ColumnCustomizer, { ColumnConfig } from './ColumnCustomizer';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

// Dynamically import view components for code splitting
const ProductCardView = lazy(() => import('./ProductCardView'));
const ProductGridView = lazy(() => import('./ProductGridView'));
const VirtualizedProductList = lazy(() => import('./VirtualizedProductList'));
const ResponsiveProductList = lazy(() => import('./ResponsiveProductList'));

export type SortField = 'name' | 'price' | 'createdAt' | 'updatedAt' | 'stock';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'table' | 'grid' | 'card' | 'virtual';

interface EnhancedProductListProps {
  products: Product[];
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkUpdate?: (ids: string[], data: Partial<Product>) => Promise<void>;
  onSort?: (field: SortField, direction: SortDirection) => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
}

// Default column configuration
const defaultColumns: ColumnConfig[] = [
  { id: 'checkbox', label: 'Select', visible: true, required: true, width: '40px' },
  { id: 'product', label: 'Product', visible: true, required: true },
  { id: 'category', label: 'Category', visible: true },
  { id: 'price', label: 'Price', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'stock', label: 'Stock', visible: true },
  { id: 'updated', label: 'Last Updated', visible: true },
  { id: 'actions', label: 'Actions', visible: true, required: true, width: '120px' }
];

export default function EnhancedProductList({
  products,
  onDelete,
  onBulkDelete,
  onBulkUpdate,
  onSort,
  sortField = 'name',
  sortDirection = 'asc'
}: EnhancedProductListProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<{ [key: string]: string }>({});
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicatingProductId, setDuplicatingProductId] = useState<string | null>(null);

  // Check if we're on a mobile device
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [bulkAction, setBulkAction] = useState<string>('');

  // New state for enhanced features
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [savedViewPreference, setSavedViewPreference] = useState(false);

  // Load user preferences from localStorage on component mount
  useEffect(() => {
    const loadUserPreferences = () => {
      try {
        // Load view mode preference
        const savedViewMode = localStorage.getItem('productListViewMode');
        if (savedViewMode) {
          setViewMode(savedViewMode as ViewMode);
        }

        // Load column configuration
        const savedColumns = localStorage.getItem('productListColumns');
        if (savedColumns) {
          setColumns(JSON.parse(savedColumns));
        }

        setSavedViewPreference(true);
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadUserPreferences();
  }, []);

  // Save user preferences to localStorage when they change
  useEffect(() => {
    if (!savedViewPreference) return;

    try {
      localStorage.setItem('productListViewMode', viewMode);
      localStorage.setItem('productListColumns', JSON.stringify(columns));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }, [viewMode, columns, savedViewPreference]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'categories');
        const snapshot = await getDocs(categoriesRef);
        const categoryMap: { [key: string]: string } = {};
        snapshot.docs.forEach(doc => {
          categoryMap[doc.id] = doc.data().name;
        });
        setCategories(categoryMap);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Reset selection when products change
  useEffect(() => {
    setSelectedProducts([]);
    setSelectAll(false);
  }, [products]);

  // Toggle select all products
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(product => product.id));
    }
    setSelectAll(!selectAll);
  };

  // Memoize products for better performance
  const sortedProducts = useMemo(() => {
    if (!onSort || !sortField) return products;

    return [...products].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      aValue = String(aValue || '');
      bValue = String(bValue || '');

      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [products, sortField, sortDirection, onSort]);

  // Toggle select individual product with useCallback for better performance
  const handleSelectProduct = useCallback((id: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(id)) {
        const newSelection = prev.filter(productId => productId !== id);
        setSelectAll(false);
        return newSelection;
      } else {
        const newSelection = [...prev, id];
        if (newSelection.length === products.length) {
          setSelectAll(true);
        }
        return newSelection;
      }
    });
  }, [products.length]);

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!selectedProducts.length) return;

    setShowDeleteConfirmation(true);
  };

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    if (!selectedProducts.length) return;

    setIsProcessing(true);

    try {
      if (onBulkDelete) {
        await onBulkDelete(selectedProducts);
      } else {
        // Use the API endpoint for bulk operations
        const response = await fetch('/api/admin/products/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete',
            productIds: selectedProducts,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete products');
        }
      }

      showToast(`Successfully deleted ${selectedProducts.length} products`, 'success');
      setSelectedProducts([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error performing bulk delete:', error);
      showToast('Error deleting products', 'error');
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirmation(false);
    }
  };

  // Handle bulk update
  const handleBulkUpdate = async (data: Partial<Product>) => {
    if (!selectedProducts.length) return;

    setIsProcessing(true);
    setBulkAction('');

    try {
      if (onBulkUpdate) {
        await onBulkUpdate(selectedProducts, data);
      } else {
        // Use the API endpoint for bulk operations
        const response = await fetch('/api/admin/products/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update',
            productIds: selectedProducts,
            data: data,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update products');
        }
      }

      showToast(`Successfully updated ${selectedProducts.length} products`, 'success');
    } catch (error) {
      console.error('Error performing bulk update:', error);
      showToast('Error updating products', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle bulk duplicate
  const handleBulkDuplicate = async () => {
    if (!selectedProducts.length) return;

    if (!window.confirm(`Are you sure you want to duplicate ${selectedProducts.length} products?`)) return;

    setIsProcessing(true);

    try {
      // Duplicate each product one by one
      for (const productId of selectedProducts) {
        setDuplicatingProductId(productId);

        const response = await fetch('/api/admin/products/duplicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to duplicate product');
        }

        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to avoid overwhelming the server
      }

      showToast(`Successfully duplicated ${selectedProducts.length} products`, 'success');
      setSelectedProducts([]);
      setSelectAll(false);

      // Refresh the product list
      router.refresh();
    } catch (error) {
      console.error('Error duplicating products:', error);
      showToast('Error duplicating products', 'error');
    } finally {
      setIsProcessing(false);
      setDuplicatingProductId(null);
    }
  };

  // Process bulk action
  const processBulkAction = () => {
    switch (bulkAction) {
      case 'delete':
        handleBulkDelete();
        break;
      case 'duplicate':
        handleBulkDuplicate();
        break;
      case 'markNew':
        handleBulkUpdate({ isNew: true });
        break;
      case 'unmarkNew':
        handleBulkUpdate({ isNew: false });
        break;
      case 'markFeatured':
        handleBulkUpdate({ isFeatured: true });
        break;
      case 'unmarkFeatured':
        handleBulkUpdate({ isFeatured: false });
        break;
      case 'markSale':
        handleBulkUpdate({ isSale: true });
        break;
      case 'unmarkSale':
        handleBulkUpdate({ isSale: false });
        break;
      default:
        break;
    }
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (!onSort) return;

    // If already sorting by this field, toggle direction
    if (field === sortField) {
      onSort(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for new sort field
      onSort(field, 'asc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (field !== sortField) {
      return null;
    }

    return sortDirection === 'asc'
      ? <span className="ml-1">↑</span>
      : <span className="ml-1">↓</span>;
  };

  // Handle product duplication
  const handleDuplicate = async (productId: string) => {
    if (!window.confirm('Are you sure you want to duplicate this product?')) return;

    try {
      setDuplicatingProductId(productId);

      const response = await fetch('/api/admin/products/duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate product');
      }

      showToast('Product duplicated successfully', 'success');

      // Refresh the product list
      router.refresh();
    } catch (error) {
      console.error('Error duplicating product:', error);
      showToast('Error duplicating product', 'error');
    } finally {
      setDuplicatingProductId(null);
    }
  };

  // Handle inline editing
  const handleInlineEdit = async (productId: string, field: string, value: any) => {
    try {
      setIsProcessing(true);

      // Update the product in Firestore
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        [field]: value,
        updatedAt: new Date().toISOString()
      });

      showToast(`Product ${field} updated successfully`, 'success');

      // Refresh the product list
      router.refresh();
    } catch (error) {
      console.error(`Error updating product ${field}:`, error);
      showToast(`Error updating product ${field}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle column configuration change
  const handleColumnChange = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns);
  };

  // Render view mode toggle buttons
  const renderViewModeToggle = () => {
    // If on mobile, don't show view mode toggle
    if (isMobile) {
      return (
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-md bg-primary-100 text-primary-700">
            <FiSmartphone className="h-5 w-5" />
          </div>
          <span className="text-sm text-gray-600">Mobile View</span>
        </div>
      );
    }

    // Desktop view mode toggle
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setViewMode('table')}
          className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'}`}
          title="Table view"
        >
          <FiList className="h-5 w-5" />
        </button>
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'}`}
          title="Grid view"
        >
          <FiGrid className="h-5 w-5" />
        </button>
        <button
          onClick={() => setViewMode('card')}
          className={`p-2 rounded-md ${viewMode === 'card' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'}`}
          title="Card view"
        >
          <FiColumns className="h-5 w-5" />
        </button>
        <button
          onClick={() => setViewMode('virtual')}
          className={`p-2 rounded-md ${viewMode === 'virtual' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'}`}
          title="Virtual list (optimized for large datasets)"
        >
          <FiZap className="h-5 w-5" />
        </button>
      </div>
    );
  };

  // Render delete confirmation modal
  const renderDeleteConfirmationModal = () => (
    showDeleteConfirmation && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center text-red-600 mb-4">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium">Confirm Deletion</h3>
          </div>
          <p className="mb-4">
            Are you sure you want to delete {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''}? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowDeleteConfirmation(false)}
              variant="secondary"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBulkDelete}
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    )
  );

  // Render bulk actions UI
  const renderBulkActionsUI = () => (
    selectedProducts.length > 0 && (
      <div className="bg-gray-50 p-4 rounded-md shadow-sm mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700">
              {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              disabled={isProcessing}
            >
              <option value="">Select action</option>
              <option value="delete">Delete</option>
              <option value="duplicate">Duplicate</option>
              <option value="markFeatured">Mark as Featured</option>
              <option value="unmarkFeatured">Remove Featured</option>
              <option value="markNew">Mark as New</option>
              <option value="unmarkNew">Remove New</option>
              <option value="markSale">Mark as Sale</option>
              <option value="unmarkSale">Remove Sale</option>
            </select>

            <Button
              onClick={processBulkAction}
              disabled={!bulkAction || isProcessing}
              variant="primary"
              size="sm"
            >
              {isProcessing ? 'Processing...' : 'Apply'}
            </Button>

            <Button
              onClick={() => {
                setSelectedProducts([]);
                setSelectAll(false);
              }}
              variant="secondary"
              size="sm"
              disabled={isProcessing}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </div>
    )
  );

  // Render view controls
  const renderViewControls = () => (
    <div className="flex flex-wrap justify-between items-center mb-4 p-4 bg-white rounded-t-lg border border-neutral-200 border-b-0">
      <div className="flex items-center space-x-4">
        {renderViewModeToggle()}

        {viewMode === 'table' && (
          <ColumnCustomizer
            columns={columns}
            onChange={handleColumnChange}
          />
        )}
      </div>

      <div className="text-sm text-neutral-500">
        {products.length} product{products.length !== 1 ? 's' : ''}
      </div>
    </div>
  );

  // Loading fallback component
  const LoadingView = () => (
    <div className="p-8 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      <p className="mt-4 text-gray-600">Loading view...</p>
    </div>
  );

  // Render the appropriate view based on viewMode
  const renderProductView = () => {
    // If on mobile, use the responsive table regardless of view mode
    if (isMobile) {
      return (
        <Suspense fallback={<LoadingView />}>
          <ResponsiveProductList
            products={sortedProducts}
            categories={categories}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDelete={onDelete}
            onDuplicate={handleDuplicate}
            duplicatingProductId={duplicatingProductId}
            isProcessing={isProcessing}
          />
        </Suspense>
      );
    }

    // On desktop, use the selected view mode
    switch (viewMode) {
      case 'card':
        return (
          <Suspense fallback={<LoadingView />}>
            <ProductCardView
              products={sortedProducts}
              categories={categories}
              selectedProducts={selectedProducts}
              onSelectProduct={handleSelectProduct}
              onDelete={onDelete}
              onDuplicate={handleDuplicate}
              duplicatingProductId={duplicatingProductId}
              isProcessing={isProcessing}
              onInlineEdit={handleInlineEdit}
            />
          </Suspense>
        );
      case 'grid':
        return (
          <Suspense fallback={<LoadingView />}>
            <ProductGridView
              products={sortedProducts}
              categories={categories}
              selectedProducts={selectedProducts}
              onSelectProduct={handleSelectProduct}
              onDelete={onDelete}
              onDuplicate={handleDuplicate}
              duplicatingProductId={duplicatingProductId}
              isProcessing={isProcessing}
              onInlineEdit={handleInlineEdit}
            />
          </Suspense>
        );
      case 'virtual':
        // Get visible column IDs
        const visibleColumnIds = columns.filter(col => col.visible).map(col => col.id);
        return (
          <Suspense fallback={<LoadingView />}>
            <VirtualizedProductList
              products={sortedProducts}
              categories={categories}
              selectedProducts={selectedProducts}
              onSelectProduct={handleSelectProduct}
              onDelete={onDelete}
              onDuplicate={handleDuplicate}
              duplicatingProductId={duplicatingProductId}
              isProcessing={isProcessing}
              visibleColumns={visibleColumnIds}
            />
          </Suspense>
        );
      default:
        // Table view with visible columns only
        const visibleColumns = columns.filter(col => col.visible);

        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {visibleColumns.map(column => {
                    if (column.id === 'checkbox') {
                      return (
                        <th key={column.id} scope="col" className="sticky left-0 z-20 bg-gray-50 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={column.width ? { width: column.width } : undefined}>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              checked={selectAll}
                              onChange={handleSelectAll}
                              disabled={isProcessing}
                            />
                          </div>
                        </th>
                      );
                    }

                    if (column.id === 'product') {
                      return (
                        <th
                          key={column.id}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center">
                            Product
                            {renderSortIndicator('name')}
                          </div>
                        </th>
                      );
                    }

                    if (column.id === 'category') {
                      return (
                        <th key={column.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                      );
                    }

                    if (column.id === 'price') {
                      return (
                        <th
                          key={column.id}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('price')}
                        >
                          <div className="flex items-center">
                            Price
                            {renderSortIndicator('price')}
                          </div>
                        </th>
                      );
                    }

                    if (column.id === 'status') {
                      return (
                        <th key={column.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      );
                    }

                    if (column.id === 'stock') {
                      return (
                        <th
                          key={column.id}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('stock')}
                        >
                          <div className="flex items-center">
                            Stock
                            {renderSortIndicator('stock')}
                          </div>
                        </th>
                      );
                    }

                    if (column.id === 'updated') {
                      return (
                        <th
                          key={column.id}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('updatedAt')}
                        >
                          <div className="flex items-center">
                            Last Updated
                            {renderSortIndicator('updatedAt')}
                          </div>
                        </th>
                      );
                    }

                    if (column.id === 'actions') {
                      return (
                        <th key={column.id} scope="col" className="sticky right-0 z-20 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={column.width ? { width: column.width } : undefined}>
                          Actions
                        </th>
                      );
                    }

                    return null;
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProducts.map((product) => (
                  <tr key={product.id} className={selectedProducts.includes(product.id) ? "bg-blue-50" : ""}>
                    {visibleColumns.map(column => {
                      if (column.id === 'checkbox') {
                        return (
                          <td key={`${product.id}-${column.id}`} className="sticky left-0 z-10 bg-white px-2 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                checked={selectedProducts.includes(product.id)}
                                onChange={() => handleSelectProduct(product.id)}
                                disabled={isProcessing}
                              />
                            </div>
                          </td>
                        );
                      }

                      if (column.id === 'product') {
                        return (
                          <td key={`${product.id}-${column.id}`} className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 relative flex-shrink-0">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-10 w-10 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">No image</span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div
                                  className="text-sm font-medium text-gray-900 cursor-pointer hover:text-primary-600"
                                  onClick={() => handleInlineEdit(product.id, 'name', product.name)}
                                  title="Click to edit"
                                >
                                  {product.name}
                                </div>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      if (column.id === 'category') {
                        return (
                          <td key={`${product.id}-${column.id}`} className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {categories[product.category] || 'Unknown Category'}
                            </div>
                          </td>
                        );
                      }

                      if (column.id === 'price') {
                        return (
                          <td key={`${product.id}-${column.id}`} className="px-6 py-4 whitespace-nowrap">
                            <div
                              className="text-sm text-gray-900 cursor-pointer hover:text-primary-600"
                              onClick={() => handleInlineEdit(product.id, 'price', product.price)}
                              title="Click to edit"
                            >
                              ${product.price}
                            </div>
                            {product.isSale && product.salePrice && (
                              <div
                                className="text-sm text-red-600 cursor-pointer hover:text-red-800"
                                onClick={() => handleInlineEdit(product.id, 'salePrice', product.salePrice)}
                                title="Click to edit sale price"
                              >
                                ${product.salePrice}
                              </div>
                            )}
                          </td>
                        );
                      }

                      if (column.id === 'status') {
                        return (
                          <td key={`${product.id}-${column.id}`} className="px-6 py-4 whitespace-nowrap">
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
                        );
                      }

                      if (column.id === 'stock') {
                        return (
                          <td key={`${product.id}-${column.id}`} className="px-6 py-4 whitespace-nowrap">
                            {product.trackInventory ? (
                              <div
                                className="text-sm cursor-pointer hover:text-primary-600"
                                onClick={() => handleInlineEdit(product.id, 'stock', product.stock || 0)}
                                title="Click to edit"
                              >
                                {typeof product.stock === 'number' ? (
                                  product.stock <= 0 ? (
                                    <span className="text-red-600">{product.stock} (Out of stock)</span>
                                  ) : product.stock <= (product.lowStockThreshold || 5) ? (
                                    <span className="text-yellow-600">{product.stock} (Low)</span>
                                  ) : (
                                    <span className="text-green-600">{product.stock}</span>
                                  )
                                ) : 'N/A'}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Not tracked</span>
                            )}
                          </td>
                        );
                      }

                      if (column.id === 'updated') {
                        return (
                          <td key={`${product.id}-${column.id}`} className="px-6 py-4 whitespace-nowrap">
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
                        );
                      }

                      if (column.id === 'actions') {
                        return (
                          <td key={`${product.id}-${column.id}`} className="sticky right-0 z-10 bg-white px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <a
                                href={`/admin/products/${product.id}`}
                                className="text-primary-600 hover:text-primary-900"
                                title="Edit product"
                              >
                                <FiEdit2 className="h-5 w-5" />
                              </a>
                              <button
                                onClick={() => handleDuplicate(product.id)}
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
                        );
                      }

                      return null;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderBulkActionsUI()}
      {renderDeleteConfirmationModal()}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        {renderViewControls()}
        {renderProductView()}
      </div>
    </div>
  );
}