"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { FilterOption } from '@/lib/types';

interface ActiveFiltersProps {
  activeFilters: Record<string, string>;
  filterOptions: FilterOption[];
  onRemoveFilter: (filterId: string) => void;
  onClearFilters: () => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  activeFilters,
  filterOptions,
  onRemoveFilter,
  onClearFilters
}) => {
  const getFilterLabel = (filterId: string, value: string): string => {
    const filterOption = filterOptions.find(option => option.id === filterId);
    if (!filterOption) return value;
    
    const option = filterOption.options.find(opt => opt.value === value);
    return option ? `${filterOption.name}: ${option.label}` : value;
  };

  if (Object.keys(activeFilters).length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 py-3">
      <div className="container">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          
          {Object.entries(activeFilters).map(([filterId, value]) => (
            <motion.div
              key={filterId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center py-1 px-2 rounded-md bg-white border border-gray-300 text-sm text-gray-700"
            >
              {getFilterLabel(filterId, value)}
              <button
                type="button"
                className="ml-1 text-gray-400 hover:text-gray-600"
                onClick={() => onRemoveFilter(filterId)}
              >
                <FiX size={16} />
              </button>
            </motion.div>
          ))}
          
          <button
            type="button"
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            onClick={onClearFilters}
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveFilters;
