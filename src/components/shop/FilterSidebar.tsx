"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiX, FiFilter } from 'react-icons/fi';
import { FilterOption } from '@/lib/types';
import { classNames } from '@/lib/utils';

interface FilterSidebarProps {
  filterOptions: FilterOption[];
  activeFilters: Record<string, string>;
  onFilterChange: (filterId: string, value: string) => void;
  onClearFilters: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filterOptions,
  activeFilters,
  onFilterChange,
  onClearFilters,
  isMobile = false,
  isOpen = false,
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(filterOptions.map(filter => [filter.id, true]))
  );

  const toggleSection = (filterId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [filterId]: !prev[filterId]
    }));
  };

  const sidebarContent = (
    <div className={classNames(
      "flex flex-col",
      isMobile ? "h-full" : ""
    )}>
      {/* Header - only for mobile */}
      {isMobile && (
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <FiFilter className="mr-2" /> Filters
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close filters"
          >
            <FiX size={24} />
          </button>
        </div>
      )}

      {/* Filter sections */}
      <div className={classNames(
        "flex-grow overflow-y-auto",
        isMobile ? "p-4" : ""
      )}>
        {!isMobile && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            {Object.keys(activeFilters).length > 0 && (
              <button
                onClick={onClearFilters}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        <div className="space-y-6">
          {filterOptions.map((filter) => (
            <div key={filter.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <button
                className="flex w-full items-center justify-between text-gray-900 font-medium"
                onClick={() => toggleSection(filter.id)}
                aria-expanded={expandedSections[filter.id]}
              >
                <span>{filter.name}</span>
                <motion.span
                  animate={{ rotate: expandedSections[filter.id] ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FiChevronDown />
                </motion.span>
              </button>

              <AnimatePresence>
                {expandedSections[filter.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-2">
                      {filter.options.map((option) => (
                        <div key={option.value} className="flex items-center">
                          <input
                            id={`filter-${filter.id}-${option.value}`}
                            name={`filter-${filter.id}`}
                            value={option.value}
                            type="radio"
                            checked={activeFilters[filter.id] === option.value}
                            onChange={() => onFilterChange(filter.id, option.value)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`filter-${filter.id}-${option.value}`}
                            className="ml-3 text-sm text-gray-600 cursor-pointer"
                          >
                            {option.label}
                            {option.count !== undefined && (
                              <span className="ml-1 text-gray-400">({option.count})</span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Footer - only for mobile */}
      {isMobile && (
        <div className="border-t border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onClearFilters}
              className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Clear all
            </button>
            <button
              onClick={onClose}
              className="py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Apply filters
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={onClose}
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl z-50 flex flex-col"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="w-full">
      {sidebarContent}
    </div>
  );
};

export default FilterSidebar;
