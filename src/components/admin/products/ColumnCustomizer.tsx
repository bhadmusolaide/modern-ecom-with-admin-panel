'use client';

import React, { useState } from 'react';
import { FiX, FiMenu, FiEye, FiEyeOff } from 'react-icons/fi';
import Button from '@/components/ui/Button';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  required?: boolean;
  width?: string;
}

interface ColumnCustomizerProps {
  columns: ColumnConfig[];
  onChange: (columns: ColumnConfig[]) => void;
}

export default function ColumnCustomizer({ columns, onChange }: ColumnCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);

  // Handle drag start
  const handleDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnId) return;

    const draggedIndex = localColumns.findIndex(col => col.id === draggedColumn);
    const targetIndex = localColumns.findIndex(col => col.id === targetColumnId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create a new array with the reordered columns
    const newColumns = [...localColumns];
    const [draggedItem] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedItem);

    setLocalColumns(newColumns);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    const newColumns = localColumns.map(col =>
      col.id === columnId && !col.required ? { ...col, visible: !col.visible } : col
    );
    setLocalColumns(newColumns);
  };

  // Apply changes
  const applyChanges = () => {
    onChange(localColumns);
    setIsOpen(false);
  };

  // Reset to default
  const resetToDefault = () => {
    setLocalColumns(columns);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors text-sm"
      >
        <FiMenu className="mr-2" /> Customize Columns
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-50 border border-neutral-200">
          <div className="p-3 border-b border-neutral-200 flex justify-between items-center">
            <h3 className="text-sm font-medium text-neutral-900">Customize Columns</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 max-h-80 overflow-y-auto">
            <p className="text-xs text-neutral-500 mb-2">Drag to reorder columns. Click the eye icon to show/hide.</p>

            <ul className="space-y-1">
              {localColumns.map(column => (
                <li
                  key={column.id}
                  draggable={true}
                  onDragStart={() => handleDragStart(column.id)}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-2 rounded-md cursor-move ${
                    draggedColumn === column.id ? 'bg-blue-50' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center">
                    <FiMenu className="h-4 w-4 text-neutral-400 mr-2" />
                    <span className="text-sm">{column.label}</span>
                    {column.required && (
                      <span className="ml-1 text-xs text-neutral-500">(Required)</span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleColumnVisibility(column.id)}
                    className={`${
                      column.visible ? 'text-primary-600' : 'text-neutral-400'
                    } hover:text-primary-800 ${column.required ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={column.required}
                    title={column.required ? "This column cannot be hidden" : column.visible ? "Hide column" : "Show column"}
                  >
                    {column.visible ? <FiEye className="h-4 w-4" /> : <FiEyeOff className="h-4 w-4" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 border-t border-neutral-200 flex justify-between">
            <button
              onClick={resetToDefault}
              className="inline-flex items-center px-3 py-1.5 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors text-sm"
            >
              Reset
            </button>
            <button
              onClick={applyChanges}
              className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}