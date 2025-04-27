'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { collection, getDocs, query, where, orderBy, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { FiSearch, FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Image from 'next/image';
import { debounce } from 'lodash';

interface ProductSearchProps {
  onSelectProduct?: (product: Product) => void;
  isModal?: boolean;
  initialFilters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  };
}

const ProductSearch: React.FC<ProductSearchProps> = ({ 
  onSelectProduct, 
  isModal = false,
  initialFilters = {}
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    category: initialFilters.category || '',
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    inStock: initialFilters.inStock || false,
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'categories');
        const snapshot = await getDocs(categoriesRef);
        const categoriesList = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setCategories(categoriesList);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      fetchProducts(term);
    }, 500),
    [filters] // Re-create when filters change
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFilters(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Apply filters and search
  const applyFilters = () => {
    setProducts([]);
    setLastDoc(null);
    setHasMore(true);
    fetchProducts(searchTerm);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      inStock: false,
    });
    
    // Re-fetch with reset filters
    setProducts([]);
    setLastDoc(null);
    setHasMore(true);
    fetchProducts(searchTerm);
  };

  // Fetch products with search and filters
  const fetchProducts = async (term: string = '', loadMore: boolean = false) => {
    try {
      setLoading(true);
      
      // Start building the query
      let productsQuery = collection(db, 'products');
      let constraints: any[] = [];
      
      // Add search term filter if provided
      if (term) {
        // This is a simplified search - in a real app, you might want to use
        // a more sophisticated search solution like Algolia or Elasticsearch
        constraints.push(where('name', '>=', term));
        constraints.push(where('name', '<=', term + '\uf8ff'));
      }
      
      // Add category filter if selected
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      
      // Add stock filter if selected
      if (filters.inStock) {
        constraints.push(where('stock', '>', 0));
      }
      
      // Add price range filters if provided
      // Note: Firestore doesn't support multiple range queries on different fields
      // So we'll filter the price range in JavaScript after fetching
      
      // Add ordering and pagination
      constraints.push(orderBy('name'));
      constraints.push(limit(10));
      
      // If loading more, start after the last document
      if (loadMore && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      
      // Execute the query
      const q = query(productsQuery, ...constraints);
      const snapshot = await getDocs(q);
      
      // Process the results
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // Filter by price range in JavaScript (since Firestore can't do multiple range queries)
      let filteredProducts = fetchedProducts;
      if (filters.minPrice) {
        const minPrice = parseFloat(filters.minPrice as string);
        filteredProducts = filteredProducts.filter(product => product.price >= minPrice);
      }
      if (filters.maxPrice) {
        const maxPrice = parseFloat(filters.maxPrice as string);
        filteredProducts = filteredProducts.filter(product => product.price <= maxPrice);
      }
      
      // Update state
      setProducts(prev => loadMore ? [...prev, ...filteredProducts] : filteredProducts);
      setLastDoc(snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null);
      setHasMore(snapshot.docs.length === 10); // If we got less than the limit, there are no more
      
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load more products
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(searchTerm, true);
    }
  };

  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      router.push(`/admin/products/${product.id}`);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          
          <Button
            type="button"
            variant={showFilters ? "primary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="md:w-auto w-full"
          >
            <FiFilter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? 
              <FiChevronUp className="h-4 w-4 ml-2" /> : 
              <FiChevronDown className="h-4 w-4 ml-2" />
            }
          </Button>
        </div>
        
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price
                </label>
                <Input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  min="0"
                  step="0.01"
                  placeholder="Min"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price
                </label>
                <Input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  min="0"
                  step="0.01"
                  placeholder="Max"
                />
              </div>
            </div>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="inStock"
                name="inStock"
                checked={filters.inStock}
                onChange={handleFilterChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="inStock" className="ml-2 block text-sm text-gray-700">
                In Stock Only
              </label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
              >
                Reset
              </Button>
              <Button
                type="button"
                onClick={applyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {loading && products.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Searching products...</p>
        </div>
      ) : products.length > 0 ? (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr 
                    key={product.id} 
                    onClick={() => handleSelectProduct(product)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-10 w-10 rounded-md overflow-hidden">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No img</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.categoryName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${product.price.toFixed(2)}
                        {product.isSale && product.salePrice && (
                          <span className="ml-2 line-through text-gray-500">
                            ${product.salePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {product.stock !== undefined ? product.stock : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        {product.isNew && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                        {product.isSale && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Sale
                          </span>
                        )}
                        {product.isFeatured && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Featured
                          </span>
                        )}
                        {!product.isNew && !product.isSale && !product.isFeatured && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Standard
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {hasMore && (
            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="outline"
                onClick={loadMore}
                isLoading={loading}
                disabled={loading}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <FiSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">
            {searchTerm ? 
              `No products matching "${searchTerm}"` : 
              'Try adjusting your search or filters to find what you\'re looking for.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;