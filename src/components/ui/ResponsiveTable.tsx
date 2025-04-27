'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  mobileLabel?: string;
  priority?: 'high' | 'medium' | 'low';
  hidden?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingRows?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  mobileCardMode?: boolean;
}

function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  onRowClick,
  className = '',
  emptyMessage = 'No data available',
  isLoading = false,
  loadingRows = 5,
  pagination,
  mobileCardMode = true,
}: ResponsiveTableProps<T>) {
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Handle sorting
  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Toggle row expansion for mobile view
  const toggleRowExpansion = (key: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Sort data if sortField is set
  const sortedData = React.useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === bValue) return 0;

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      // Handle date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Default comparison
      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [data, sortField, sortDirection]);

  // Render loading skeleton
  const renderLoadingSkeleton = () => {
    return Array.from({ length: loadingRows }).map((_, rowIndex) => (
      <tr key={`loading-row-${rowIndex}`} className="animate-pulse">
        {columns.filter(col => !col.hidden).map((column, colIndex) => (
          <td key={`loading-cell-${rowIndex}-${colIndex}`} className="p-3 border-b border-neutral-200">
            <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
          </td>
        ))}
      </tr>
    ));
  };

  // Render cell content
  const renderCellContent = (item: T, column: Column<T>) => {
    if (column.cell) {
      return column.cell(item);
    }

    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }

    return item[column.accessor] as React.ReactNode;
  };

  // Render pagination controls
  const renderPagination = () => {
    if (!pagination) return null;

    const { currentPage, totalPages, onPageChange } = pagination;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage <= 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <ChevronRight className="h-5 w-5 transform rotate-180" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum;

                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage >= totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>

        {/* Mobile pagination */}
        <div className="flex items-center justify-between sm:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage <= 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage >= totalPages
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Render mobile card view
  const renderMobileCards = () => {
    if (sortedData.length === 0 && !isLoading) {
      return (
        <div className="p-8 text-center text-neutral-500">{emptyMessage}</div>
      );
    }

    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: loadingRows }).map((_, index) => (
            <div key={`loading-card-${index}`} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 animate-pulse">
              <div className="h-4 bg-neutral-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`loading-card-row-${index}-${i}`} className="flex justify-between">
                    <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
                    <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sortedData.map(item => {
          const key = String(item[keyField]);
          const isExpanded = expandedRows[key] || false;

          // Get high priority columns for the card header
          const highPriorityColumns = columns.filter(col => col.priority === 'high' && !col.hidden);
          const mediumPriorityColumns = columns.filter(col => col.priority === 'medium' && !col.hidden);
          const lowPriorityColumns = columns.filter(col => (!col.priority || col.priority === 'low') && !col.hidden);

          return (
            <div
              key={key}
              className={`bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {/* Card header with high priority columns */}
              <div className="p-4 border-b border-neutral-200">
                {highPriorityColumns.map(column => (
                  <div key={`card-header-${String(column.accessor)}`}>
                    {renderCellContent(item, column)}
                  </div>
                ))}
              </div>

              {/* Card body with medium priority columns */}
              <div className="p-4">
                {mediumPriorityColumns.map(column => (
                  <div key={`card-body-${String(column.accessor)}`} className="flex justify-between py-1">
                    <span className="text-sm font-medium text-neutral-500">
                      {column.mobileLabel || column.header}:
                    </span>
                    <span className="text-sm text-neutral-900">
                      {renderCellContent(item, column)}
                    </span>
                  </div>
                ))}

                {/* Expandable section for low priority columns */}
                {lowPriorityColumns.length > 0 && (
                  <>
                    <button
                      className="flex items-center justify-between w-full mt-2 pt-2 text-sm text-primary-600 border-t border-neutral-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowExpansion(key);
                      }}
                    >
                      <span>{isExpanded ? 'Show less' : 'Show more'}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-neutral-100">
                        {lowPriorityColumns.map(column => (
                          <div key={`card-expanded-${String(column.accessor)}`} className="flex justify-between py-1">
                            <span className="text-sm font-medium text-neutral-500">
                              {column.mobileLabel || column.header}:
                            </span>
                            <span className="text-sm text-neutral-900">
                              {renderCellContent(item, column)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render desktop table view
  const renderDesktopTable = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              {columns.filter(col => !col.hidden).map(column => (
                <th
                  key={String(column.accessor)}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer select-none' : ''
                  } ${column.className || ''}`}
                  onClick={() => column.sortable && handleSort(column.accessor as keyof T)}
                >
                  <div className="flex items-center">
                    <span>{column.header}</span>
                    {column.sortable && sortField === column.accessor && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {isLoading ? (
              renderLoadingSkeleton()
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.filter(col => !col.hidden).length}
                  className="px-6 py-4 text-center text-neutral-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map(item => (
                <tr
                  key={String(item[keyField])}
                  className={onRowClick ? 'cursor-pointer hover:bg-neutral-50' : ''}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.filter(col => !col.hidden).map(column => (
                    <td
                      key={`${String(item[keyField])}-${String(column.accessor)}`}
                      className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                    >
                      {renderCellContent(item, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`bg-white shadow-sm rounded-lg overflow-hidden ${className}`}>
      {/* Mobile view */}
      <div className="md:hidden">
        {mobileCardMode ? renderMobileCards() : renderDesktopTable()}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block">
        {renderDesktopTable()}
      </div>

      {/* Pagination */}
      {pagination && renderPagination()}
    </div>
  );
}

export default ResponsiveTable;
