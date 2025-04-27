"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiSliders, FiGrid, FiList, FiX, FiSearch } from 'react-icons/fi';
import ProductList from '@/components/shop/ProductList';
import { Product, Category, FilterOption } from '@/lib/types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { categories as allCategories } from '@/lib/data/categories';
import LoadingState from '@/components/ui/LoadingState';

export default function ShopPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ShopPageContent />
    </Suspense>
  );
}

function ShopPageContent() {
  // Products and filtering state
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(allCategories);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilters, setSelectedFilters] = useState<{
    price: string[];
    colors: string[];
    sizes: string[];
  }>({
    price: [],
    colors: [],
    sizes: []
  });
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter options
  const filterOptions: FilterOption[] = [
    {
      id: 'price',
      name: 'Price',
      options: [
        { value: 'under-50', label: 'Under $50' },
        { value: '50-100', label: '$50 - $100' },
        { value: '100-200', label: '$100 - $200' },
        { value: 'over-200', label: 'Over $200' }
      ]
    },
    {
      id: 'colors',
      name: 'Colors',
      options: [
        { value: 'black', label: 'Black' },
        { value: 'white', label: 'White' },
        { value: 'blue', label: 'Blue' },
        { value: 'red', label: 'Red' },
        { value: 'green', label: 'Green' }
      ]
    },
    {
      id: 'sizes',
      name: 'Sizes',
      options: [
        { value: 'xs', label: 'XS' },
        { value: 's', label: 'S' },
        { value: 'm', label: 'M' },
        { value: 'l', label: 'L' },
        { value: 'xl', label: 'XL' }
      ]
    }
  ];

  // Sort options
  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' },
    { value: 'best-selling', label: 'Best Selling' }
  ];

  // Check for error parameters in URL
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams?.get('error');
    if (error === 'product-not-found') {
      setErrorMessage('The product you were looking for could not be found. It may have been removed or is temporarily unavailable.');
      // Remove the error parameter from the URL without refreshing the page
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    } else if (error === 'product-error') {
      setErrorMessage('There was an error loading the product. Please try again later.');
      // Remove the error parameter from the URL without refreshing the page
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  // Fetch products from Firebase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        // First fetch categories
        const categoriesRef = collection(db, 'categories');
        const categoriesQuery = query(categoriesRef, orderBy('name'));
        const categoriesSnapshot = await getDocs(categoriesQuery);

        const categoriesList = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];

        if (categoriesList.length > 0) {
          setCategories(categoriesList);
        }

        // Create a map of category IDs to category names for quick lookup
        const categoryMap = new Map<string, string>();
        categoriesList.forEach(category => {
          categoryMap.set(category.id, category.name);
        });

        // Now fetch products
        const productsRef = collection(db, 'products');
        const productsQuery = query(productsRef, orderBy('name'));
        const snapshot = await getDocs(productsQuery);

        // Map the documents to our Product type and add category names
        const productsList = snapshot.docs.map(doc => {
          const productData = doc.data();
          const categoryId = productData.category;

          // Add the category name if we have it
          return {
            id: doc.id,
            ...productData,
            categoryName: categoryMap.get(categoryId) || 'Uncategorized'
          };
        }) as Product[];

        // Update state with the fetched products
        setAllProducts(productsList);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Apply filters whenever filter state changes
  useEffect(() => {
    if (!allProducts.length) return;

    let filteredProducts = [...allProducts];

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filteredProducts = filteredProducts.filter(product =>
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.categoryName?.toLowerCase().includes(query) ||
        product.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filteredProducts = filteredProducts.filter(
        product => product.category === selectedCategory
      );
    }

    // Filter by price
    if (selectedFilters.price.length > 0) {
      filteredProducts = filteredProducts.filter(product => {
        const price = product.isSale ? (product.salePrice || 0) : product.price;
        return selectedFilters.price.some(range => {
          if (range === 'under-50') return price < 50;
          if (range === '50-100') return price >= 50 && price < 100;
          if (range === '100-200') return price >= 100 && price < 200;
          if (range === 'over-200') return price >= 200;
          return false;
        });
      });
    }

    // Filter by colors
    if (selectedFilters.colors.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        product.colors?.some((color: string) =>
          selectedFilters.colors.includes(color.toLowerCase())
        )
      );
    }

    // Filter by sizes
    if (selectedFilters.sizes.length > 0) {
      filteredProducts = filteredProducts.filter(product =>
        product.sizes?.some((size: string) =>
          selectedFilters.sizes.includes(size.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortBy === 'price-low-high') {
      filteredProducts.sort((a, b) => {
        const priceA = a.isSale ? (a.salePrice || 0) : a.price;
        const priceB = b.isSale ? (b.salePrice || 0) : b.price;
        return priceA - priceB;
      });
    } else if (sortBy === 'price-high-low') {
      filteredProducts.sort((a, b) => {
        const priceA = a.isSale ? (a.salePrice || 0) : a.price;
        const priceB = b.isSale ? (b.salePrice || 0) : b.price;
        return priceB - priceA;
      });
    } else if (sortBy === 'newest') {
      // For demo purposes, we'll use the id as a proxy for "newest"
      // If we have createdAt, use that, otherwise use string comparison for id
      filteredProducts.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return String(b.id).localeCompare(String(a.id));
      });
    } else if (sortBy === 'best-selling') {
      // For demo purposes, we'll use rating as a proxy for "best selling"
      filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    // For 'featured', we'll keep the original order

    setProducts(filteredProducts);
  }, [allProducts, selectedCategory, selectedFilters, sortBy, searchQuery]);

  // Handle filter toggle
  const toggleFilter = (filterId: string, value: string) => {
    setSelectedFilters(prev => {
      const key = filterId as keyof typeof prev;
      const currentFilters = prev[key];

      // If the value is already selected, remove it
      if (currentFilters.includes(value)) {
        return {
          ...prev,
          [key]: currentFilters.filter(filter => filter !== value)
        };
      }

      // Otherwise, add it
      return {
        ...prev,
        [key]: [...currentFilters, value]
      };
    });
  };

  // Handle category selection
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setSelectedFilters({
      price: [],
      colors: [],
      sizes: []
    });
    setSortBy('featured');
  };

  // Count number of active filters for the mobile badge
  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (searchQuery.trim() !== '' ? 1 : 0) +
    selectedFilters.price.length +
    selectedFilters.colors.length +
    selectedFilters.sizes.length;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shop</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our collection of sustainable fashion designed for longevity and comfort.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex justify-between items-center mb-4">
            <button
              className="flex items-center text-gray-700 font-medium"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <FiSliders className="mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="flex items-center space-x-2">
              <button
                className={`p-2 rounded-md ${view === 'grid' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setView('grid')}
                aria-label="Grid view"
              >
                <FiGrid size={16} />
              </button>
              <button
                className={`p-2 rounded-md ${view === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setView('list')}
                aria-label="List view"
              >
                <FiList size={16} />
              </button>

              <select
                className="ml-2 border border-gray-300 rounded-md p-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Filter Sidebar */}
          <div
            className={`lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300 ${
              isFilterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsFilterOpen(false)}
          >
            <div
              className={`fixed right-0 top-0 h-full w-80 bg-white transform transition-transform duration-300 ease-in-out ${
                isFilterOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium">Filters</h3>
                <button onClick={() => setIsFilterOpen(false)}>
                  <FiX size={24} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
                {/* Search */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Search</h4>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-md ${
                          selectedCategory === category.id ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => handleCategoryClick(category.id.toString())}
                      >
                        <span>{category.name}</span>
                        <span className="text-xs text-gray-500">({category.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Other filters */}
                {filterOptions.map(filter => (
                  <div key={filter.id} className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">{filter.name}</h4>
                    <div className="space-y-2">
                      {filter.options.map(option => (
                        <div key={option.value} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`mobile-${filter.id}-${option.value}`}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                            checked={selectedFilters[filter.id as keyof typeof selectedFilters].includes(option.value)}
                            onChange={() => toggleFilter(filter.id, option.value)}
                          />
                          <label htmlFor={`mobile-${filter.id}-${option.value}`} className="ml-2 text-sm text-gray-700">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Apply / Clear buttons */}
                <div className="flex space-x-4 mt-6">
                  <button
                    className="flex-1 bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Apply Filters
                  </button>
                  <button
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50"
                    onClick={clearFilters}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-medium text-gray-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    className="text-sm text-primary-600 hover:text-primary-700"
                    onClick={clearFilters}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Search</h4>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
                <div className="space-y-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-md ${
                        selectedCategory === category.id ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => handleCategoryClick(category.id.toString())}
                    >
                      <span>{category.name}</span>
                      <span className="text-xs text-gray-500">({category.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Other filters */}
              {filterOptions.map(filter => (
                <div key={filter.id} className="mb-8">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">{filter.name}</h4>
                  <div className="space-y-2">
                    {filter.options.map(option => (
                      <div key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`desktop-${filter.id}-${option.value}`}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                          checked={selectedFilters[filter.id as keyof typeof selectedFilters].includes(option.value)}
                          onChange={() => toggleFilter(filter.id, option.value)}
                        />
                        <label htmlFor={`desktop-${filter.id}-${option.value}`} className="ml-2 text-sm text-gray-700">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product List */}
          <div className="flex-1">
            {/* Desktop Sort and View options */}
            <div className="hidden lg:flex justify-between items-center mb-8">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">{products.length}</span> products
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <label htmlFor="sort" className="text-sm text-gray-700 mr-2">
                    Sort by:
                  </label>
                  <select
                    id="sort"
                    className="border border-gray-300 rounded-md p-2 text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className={`p-2 rounded-md ${view === 'grid' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setView('grid')}
                    aria-label="Grid view"
                  >
                    <FiGrid size={16} />
                  </button>
                  <button
                    className={`p-2 rounded-md ${view === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setView('list')}
                    aria-label="List view"
                  >
                    <FiList size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filters display */}
            {activeFilterCount > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h3>
                <div className="flex flex-wrap gap-2">
                  {searchQuery.trim() !== '' && (
                    <button
                      className="flex items-center bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm"
                      onClick={() => setSearchQuery('')}
                    >
                      Search: {searchQuery}
                      <FiX className="ml-1" size={14} />
                    </button>
                  )}
                  {selectedCategory && (
                    <button
                      className="flex items-center bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      Category: {categories.find(c => c.id.toString() === selectedCategory)?.name}
                      <FiX className="ml-1" size={14} />
                    </button>
                  )}

                  {Object.entries(selectedFilters).map(([filterType, values]) =>
                    values.map(value => {
                      const filter = filterOptions.find(f => f.id === filterType);
                      const option = filter?.options.find(o => o.value === value);

                      return option && (
                        <button
                          key={`${filterType}-${value}`}
                          className="flex items-center bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm"
                          onClick={() => toggleFilter(filterType, value)}
                        >
                          {filter?.name}: {option.label}
                          <FiX className="ml-1" size={14} />
                        </button>
                      );
                    })
                  )}

                  {sortBy !== 'featured' && (
                    <button
                      className="flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      onClick={() => setSortBy('featured')}
                    >
                      Sort: {sortOptions.find(o => o.value === sortBy)?.label}
                      <FiX className="ml-1" size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Products */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {loading ? (
                <div className="py-12">
                  <LoadingState type="spinner" size="large" text="Loading products..." />
                </div>
              ) : products.length > 0 ? (
                <ProductList products={products} view={view} />
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">
                    {allProducts.length > 0
                      ? "Try adjusting your filters or browse our categories."
                      : "There are no products available at the moment."}
                  </p>
                  {allProducts.length > 0 && (
                    <button
                      className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700"
                      onClick={clearFilters}
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
