'use client';

import React, { useState, useEffect } from 'react';
import { FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Product, Category } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface PriceRange {
  min: number;
  max: number;
}

interface ProductFiltersProps {
  onApplyFilters: (filters: {
    categories: string[];
    priceRange: PriceRange;
    status: {
      isNew: boolean;
      isSale: boolean;
      isFeatured: boolean;
    };
    stock: {
      inStock: boolean;
      outOfStock: boolean;
      lowStock: boolean;
    };
  }) => void;
  onResetFilters: () => void;
}

export default function ProductFilters({ onApplyFilters, onResetFilters }: ProductFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 1000 });
  const [statusFilters, setStatusFilters] = useState({
    isNew: false,
    isSale: false,
    isFeatured: false
  });
  const [stockFilters, setStockFilters] = useState({
    inStock: false,
    outOfStock: false,
    lowStock: false
  });

  const [showCategoryFilter, setShowCategoryFilter] = useState(true);
  const [showPriceFilter, setShowPriceFilter] = useState(true);
  const [showStatusFilter, setShowStatusFilter] = useState(true);
  const [showStockFilter, setShowStockFilter] = useState(true);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'categories');
        const snapshot = await getDocs(categoriesRef);
        const categoriesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Category));
        setCategories(categoriesList);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0;
    setPriceRange(prev => ({
      ...prev,
      [type]: numValue
    }));
  };

  const handleStatusChange = (status: keyof typeof statusFilters) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const handleStockChange = (stock: keyof typeof stockFilters) => {
    setStockFilters(prev => ({
      ...prev,
      [stock]: !prev[stock]
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters({
      categories: selectedCategories,
      priceRange,
      status: statusFilters,
      stock: stockFilters
    });
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setPriceRange({ min: 0, max: 1000 });
    setStatusFilters({
      isNew: false,
      isSale: false,
      isFeatured: false
    });
    setStockFilters({
      inStock: false,
      outOfStock: false,
      lowStock: false
    });
    onResetFilters();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-neutral-900 flex items-center">
          <FiFilter className="mr-2" />
          Filters
        </h3>
        <button
          onClick={handleResetFilters}
          className="px-3 py-1.5 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors text-sm"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-4">
        {/* Category Filter */}
        <div className="border-b border-neutral-200 pb-4">
          <button
            className="flex items-center justify-between w-full text-left font-medium text-neutral-900 mb-2"
            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
          >
            <span>Categories</span>
            {showCategoryFilter ? <FiChevronUp /> : <FiChevronDown />}
          </button>

          {showCategoryFilter && (
            <div className="space-y-2 mt-2">
              {categories.length === 0 ? (
                <p className="text-sm text-neutral-500">Loading categories...</p>
              ) : (
                categories.map(category => (
                  <div key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-neutral-700">
                      {category.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Price Range Filter */}
        <div className="border-b border-neutral-200 pb-4">
          <button
            className="flex items-center justify-between w-full text-left font-medium text-neutral-900 mb-2"
            onClick={() => setShowPriceFilter(!showPriceFilter)}
          >
            <span>Price Range</span>
            {showPriceFilter ? <FiChevronUp /> : <FiChevronDown />}
          </button>

          {showPriceFilter && (
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="min-price" className="block text-sm text-neutral-700 mb-1">
                    Min Price
                  </label>
                  <input
                    id="min-price"
                    type="number"
                    min="0"
                    value={priceRange.min.toString()}
                    onChange={(e) => handlePriceChange('min', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="max-price" className="block text-sm text-neutral-700 mb-1">
                    Max Price
                  </label>
                  <input
                    id="max-price"
                    type="number"
                    min="0"
                    value={priceRange.max.toString()}
                    onChange={(e) => handlePriceChange('max', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="relative pt-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-neutral-500">${priceRange.min}</div>
                  <div className="text-xs text-neutral-500">${priceRange.max}</div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={priceRange.min}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={priceRange.max}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer mt-2"
                />
              </div>
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="border-b border-neutral-200 pb-4">
          <button
            className="flex items-center justify-between w-full text-left font-medium text-neutral-900 mb-2"
            onClick={() => setShowStatusFilter(!showStatusFilter)}
          >
            <span>Product Status</span>
            {showStatusFilter ? <FiChevronUp /> : <FiChevronDown />}
          </button>

          {showStatusFilter && (
            <div className="space-y-2 mt-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-new"
                  checked={statusFilters.isNew}
                  onChange={() => handleStatusChange('isNew')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="status-new" className="ml-2 text-sm text-neutral-700 flex items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-1">
                    <svg className="h-3 w-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    New
                  </span>
                  New Arrivals
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-sale"
                  checked={statusFilters.isSale}
                  onChange={() => handleStatusChange('isSale')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="status-sale" className="ml-2 text-sm text-neutral-700 flex items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-1">
                    <svg className="h-3 w-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Sale
                  </span>
                  On Sale
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="status-featured"
                  checked={statusFilters.isFeatured}
                  onChange={() => handleStatusChange('isFeatured')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="status-featured" className="ml-2 text-sm text-neutral-700 flex items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                    <svg className="h-3 w-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Featured
                  </span>
                  Featured Products
                </label>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                All selected filters are applied with AND logic (products must match all selected filters).
              </p>
            </div>
          )}
        </div>

        {/* Stock Filter */}
        <div className="border-b border-neutral-200 pb-4">
          <button
            className="flex items-center justify-between w-full text-left font-medium text-neutral-900 mb-2"
            onClick={() => setShowStockFilter(!showStockFilter)}
          >
            <span>Inventory Status</span>
            {showStockFilter ? <FiChevronUp /> : <FiChevronDown />}
          </button>

          {showStockFilter && (
            <div className="space-y-2 mt-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stock-in"
                  checked={stockFilters.inStock}
                  onChange={() => handleStockChange('inStock')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="stock-in" className="ml-2 text-sm text-neutral-700">
                  In Stock
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stock-out"
                  checked={stockFilters.outOfStock}
                  onChange={() => handleStockChange('outOfStock')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="stock-out" className="ml-2 text-sm text-neutral-700">
                  Out of Stock
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stock-low"
                  checked={stockFilters.lowStock}
                  onChange={() => handleStockChange('lowStock')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="stock-low" className="ml-2 text-sm text-neutral-700">
                  Low Stock
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleApplyFilters}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}