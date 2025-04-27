"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FiFilter, FiGrid, FiList, FiSearch } from 'react-icons/fi';

interface ShopToolbarProps {
  totalProducts: number;
  sortOption: string;
  onSortChange: (option: string) => void;
  onViewChange: (view: 'grid' | 'list') => void;
  currentView: 'grid' | 'list';
  onOpenMobileFilters: () => void;
  onSearchChange: (search: string) => void;
  searchValue: string;
}

const ShopToolbar: React.FC<ShopToolbarProps> = ({
  totalProducts,
  sortOption,
  onSortChange,
  onViewChange,
  currentView,
  onOpenMobileFilters,
  onSearchChange,
  searchValue
}) => {
  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search and Results Count */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Showing <span className="font-medium">{totalProducts}</span> results
            </p>
          </div>

          {/* Sort and View Options */}
          <div className="flex items-center space-x-4">
            {/* Mobile Filter Button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={onOpenMobileFilters}
            >
              <FiFilter className="mr-2 h-5 w-5" />
              Filters
            </button>

            {/* Sort Dropdown */}
            <div className="relative z-10">
              <select
                id="sort"
                name="sort"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={sortOption}
                onChange={(e) => onSortChange(e.target.value)}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="hidden md:flex items-center space-x-2 border border-gray-300 rounded-md">
              <motion.button
                whileHover={{ backgroundColor: '#f3f4f6' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewChange('grid')}
                className={`p-2 rounded-l-md ${
                  currentView === 'grid'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                aria-label="Grid view"
              >
                <FiGrid className="h-5 w-5" />
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: '#f3f4f6' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewChange('list')}
                className={`p-2 rounded-r-md ${
                  currentView === 'list'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                aria-label="List view"
              >
                <FiList className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopToolbar;
