'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/context/ToastContext';
import { collection, getDocs, deleteDoc, doc, query, orderBy, where, limit, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SortField, SortDirection } from '@/components/admin/ProductList';
import EnhancedProductList from '@/components/admin/products/EnhancedProductList';
import ProductImportExport from '@/components/admin/ProductImportExport';
import ProductFilters from '@/components/admin/ProductFilters';
import Link from 'next/link';
import { FiPlus, FiSearch, FiX, FiUpload, FiDownload, FiFilter, FiArrowUp, FiArrowDown, FiImage, FiTrash2 } from 'react-icons/fi';
import { withAdminPage } from '@/lib/auth/withAdminPage';

function ProductsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaningImages, setCleaningImages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportExport, setShowImportExport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter states
  const [activeFilters, setActiveFilters] = useState({
    categories: [] as string[],
    priceRange: { min: 0, max: 1000 },
    status: {
      isNew: false,
      isSale: false,
      isFeatured: false
    },
    stock: {
      inStock: false,
      outOfStock: false,
      lowStock: false
    }
  });

  useEffect(() => {
    fetchProducts();
  }, [sortField, sortDirection]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Create a query with sorting
      const productsRef = collection(db, 'products');

      // Build the query with sorting
      let productsQuery = query(
        productsRef,
        orderBy(sortField, sortDirection)
      );

      const snapshot = await getDocs(productsQuery);
      const productsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));

      setProducts(productsList);
      // Don't set filtered products here, as the useEffect for filtering will handle that
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle sorting
  const handleSort = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Apply all filters (search term and advanced filters)
  useEffect(() => {
    let filtered = [...products];

    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.categoryName?.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (activeFilters.categories.length > 0) {
      filtered = filtered.filter(product =>
        activeFilters.categories.includes(product.category)
      );
    }

    // Apply price range filter
    filtered = filtered.filter(product => {
      const price = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
      return price >= activeFilters.priceRange.min && price <= activeFilters.priceRange.max;
    });

    // Apply status filters
    if (activeFilters.status.isNew || activeFilters.status.isSale || activeFilters.status.isFeatured) {
      filtered = filtered.filter(product => {
        // If a filter is active, the product must match it
        if (activeFilters.status.isNew && !product.isNew) return false;
        if (activeFilters.status.isSale && !product.isSale) return false;
        if (activeFilters.status.isFeatured && !product.isFeatured) return false;

        // At least one filter is active and the product passed all active filters
        return true;
      });
    }

    // Apply stock filters
    if (activeFilters.stock.inStock || activeFilters.stock.outOfStock || activeFilters.stock.lowStock) {
      filtered = filtered.filter(product => {
        const stock = product.stock || 0;
        const lowStockThreshold = product.lowStockThreshold || 5;

        return (
          (activeFilters.stock.inStock && stock > lowStockThreshold) ||
          (activeFilters.stock.outOfStock && stock === 0) ||
          (activeFilters.stock.lowStock && stock > 0 && stock <= lowStockThreshold)
        );
      });
    }

    setFilteredProducts(filtered);
  }, [searchTerm, products, activeFilters]);

  // Handle applying filters
  const handleApplyFilters = (filters: any) => {
    setActiveFilters(filters);
  };

  // Handle resetting filters
  const handleResetFilters = () => {
    setActiveFilters({
      categories: [],
      priceRange: { min: 0, max: 1000 },
      status: {
        isNew: false,
        isSale: false,
        isFeatured: false
      },
      stock: {
        inStock: false,
        outOfStock: false,
        lowStock: false
      }
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(product => product.id !== id));
      setFilteredProducts(prev => prev.filter(product => product.id !== id));
      showToast('Product deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Error deleting product', 'error');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async (ids: string[]) => {
    try {
      // After successful deletion, refresh the product list
      await fetchProducts();
      return Promise.resolve();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      return Promise.reject(error);
    }
  };

  // Handle bulk update
  const handleBulkUpdate = async (ids: string[], data: Partial<Product>) => {
    try {
      // After successful update, refresh the product list
      await fetchProducts();
      return Promise.resolve();
    } catch (error) {
      console.error('Error in bulk update:', error);
      return Promise.reject(error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
          <p className="text-neutral-600">
            Manage your store products
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors"
            onClick={() => {
              setShowFilters(!showFilters);
              if (showImportExport) setShowImportExport(false);
            }}
          >
            {showFilters ? (
              <>
                <FiX className="mr-2" />
                Hide Filters
              </>
            ) : (
              <>
                <FiFilter className="mr-2" />
                Filters
              </>
            )}
          </button>
          <button
            className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors"
            onClick={() => {
              setShowImportExport(!showImportExport);
              if (showFilters) setShowFilters(false);
            }}
          >
            {showImportExport ? (
              <>
                <FiX className="mr-2" />
                Hide Import/Export
              </>
            ) : (
              <>
                <FiUpload className="mr-1" />
                <FiDownload className="mr-2" />
                Import/Export
              </>
            )}
          </button>
          <button
            className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors"
            onClick={async () => {
              if (!window.confirm('Are you sure you want to remove all product images? This action cannot be undone.')) return;

              try {
                setCleaningImages(true);

                // Get all products
                const productsRef = collection(db, 'products');
                const snapshot = await getDocs(productsRef);

                if (snapshot.empty) {
                  showToast('No products found', 'info');
                  return;
                }

                // Use a batch to update all products
                const batch = writeBatch(db);

                snapshot.forEach(document => {
                  const productRef = doc(db, 'products', document.id);
                  batch.update(productRef, {
                    image: '',
                    images: []
                  });
                });

                await batch.commit();
                showToast('All product images have been removed', 'success');

                // Refresh the product list
                await fetchProducts();
              } catch (error) {
                console.error('Error cleaning product images:', error);
                showToast('Error cleaning product images', 'error');
              } finally {
                setCleaningImages(false);
              }
            }}
            disabled={cleaningImages}
          >
            {cleaningImages ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Cleaning...
              </>
            ) : (
              <>
                <FiTrash2 className="mr-2" />
                Clear All Images
              </>
            )}
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Add Product
          </Link>
        </div>
      </div>

      {showImportExport && (
        <div className="mb-6">
          <ProductImportExport onImportComplete={fetchProducts} />
        </div>
      )}

      {showFilters && (
        <div className="mb-6">
          <ProductFilters
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Search products by name, description or category..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border border-neutral-300 rounded-md pl-10 pr-10 focus:ring-primary-500 focus:border-primary-500"
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setSearchTerm('')}
            >
              <FiX className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center">
          {/* Search results count */}
          {searchTerm && (
            <div className="text-sm text-neutral-500 mr-4">
              Found {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} matching "{searchTerm}"
            </div>
          )}

          {/* Active filters indicators */}
          {(activeFilters.categories.length > 0 ||
            activeFilters.status.isNew ||
            activeFilters.status.isSale ||
            activeFilters.status.isFeatured ||
            activeFilters.stock.inStock ||
            activeFilters.stock.outOfStock ||
            activeFilters.stock.lowStock ||
            activeFilters.priceRange.min > 0 ||
            activeFilters.priceRange.max < 1000) && (
            <div className="flex flex-wrap items-center mt-2">
              <span className="text-sm text-neutral-500 mr-2">Active filters:</span>

              {activeFilters.categories.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 mr-2 mb-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {activeFilters.categories.length} {activeFilters.categories.length === 1 ? 'category' : 'categories'}
                  <button
                    onClick={() => setActiveFilters({...activeFilters, categories: []})}
                    className="ml-1 text-blue-500 hover:text-blue-700"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </span>
              )}

              {(activeFilters.priceRange.min > 0 || activeFilters.priceRange.max < 1000) && (
                <span className="inline-flex items-center px-2 py-1 mr-2 mb-2 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Price: ${activeFilters.priceRange.min} - ${activeFilters.priceRange.max}
                  <button
                    onClick={() => setActiveFilters({...activeFilters, priceRange: { min: 0, max: 1000 }})}
                    className="ml-1 text-green-500 hover:text-green-700"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </span>
              )}

              {(activeFilters.status.isNew || activeFilters.status.isSale || activeFilters.status.isFeatured) && (
                <span className="inline-flex items-center px-2 py-1 mr-2 mb-2 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Status filters
                  <button
                    onClick={() => setActiveFilters({
                      ...activeFilters,
                      status: { isNew: false, isSale: false, isFeatured: false }
                    })}
                    className="ml-1 text-purple-500 hover:text-purple-700"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </span>
              )}

              {(activeFilters.stock.inStock || activeFilters.stock.outOfStock || activeFilters.stock.lowStock) && (
                <span className="inline-flex items-center px-2 py-1 mr-2 mb-2 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Stock filters
                  <button
                    onClick={() => setActiveFilters({
                      ...activeFilters,
                      stock: { inStock: false, outOfStock: false, lowStock: false }
                    })}
                    className="ml-1 text-yellow-500 hover:text-yellow-700"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-sm text-primary-600 hover:text-primary-800 mb-2"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-neutral-500">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-500">No products found</p>
        </div>
      ) : filteredProducts.length === 0 && searchTerm ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
          <FiSearch className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No matching products</h3>
          <p className="text-neutral-500">
            No products found matching "{searchTerm}". Try a different search term or
            <button
              onClick={() => setSearchTerm('')}
              className="text-primary-600 hover:text-primary-800 ml-1"
            >
              clear the search
            </button>.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-500">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-500">Sort by:</span>
                <div className="relative">
                  <select
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md pr-8 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    value={`${sortField}-${sortDirection}`}
                    onChange={(e) => {
                      const [field, direction] = e.target.value.split('-') as [SortField, SortDirection];
                      handleSort(field, direction);
                    }}
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="updatedAt-desc">Recently Updated</option>
                    <option value="stock-asc">Stock (Low to High)</option>
                    <option value="stock-desc">Stock (High to Low)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    {sortDirection === 'asc' ? (
                      <FiArrowUp className="h-4 w-4 text-neutral-400" />
                    ) : (
                      <FiArrowDown className="h-4 w-4 text-neutral-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <EnhancedProductList
            products={filteredProducts}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            onBulkUpdate={handleBulkUpdate}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
          />
        </div>
      )}
    </div>
  );
}

export default withAdminPage(ProductsPage);