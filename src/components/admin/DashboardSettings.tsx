'use client';

import React, { useState } from 'react';
import { Settings, X, Eye, EyeOff, Clock, RotateCcw, MoveVertical } from 'lucide-react';
import { useDashboard, WidgetConfig, TimeRange, WidgetId } from '@/lib/context/DashboardContext';

interface DashboardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardSettings: React.FC<DashboardSettingsProps> = ({ isOpen, onClose }) => {
  const { 
    widgets, 
    updateWidgetVisibility, 
    updateWidgetOrder,
    updateWidgetTimeRange,
    resetWidgetSettings,
    globalTimeRange,
    setGlobalTimeRange
  } = useDashboard();
  
  const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null);
  
  // Handle drag start
  const handleDragStart = (id: WidgetId) => {
    setDraggedWidget(id);
  };
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Handle drop to reorder widgets
  const handleDrop = (targetId: WidgetId) => {
    if (!draggedWidget || draggedWidget === targetId) {
      setDraggedWidget(null);
      return;
    }
    
    const updatedWidgets = [...widgets];
    const draggedIndex = updatedWidgets.findIndex(w => w.id === draggedWidget);
    const targetIndex = updatedWidgets.findIndex(w => w.id === targetId);
    
    const [draggedItem] = updatedWidgets.splice(draggedIndex, 1);
    updatedWidgets.splice(targetIndex, 0, draggedItem);
    
    // Update order property for each widget
    const reorderedWidgets = updatedWidgets.map((widget, index) => ({
      ...widget,
      order: index
    }));
    
    updateWidgetOrder(reorderedWidgets);
    setDraggedWidget(null);
  };
  
  // Toggle widget visibility
  const toggleWidgetVisibility = (id: WidgetId) => {
    const widget = widgets.find(w => w.id === id);
    if (widget) {
      updateWidgetVisibility(id, !widget.visible);
    }
  };
  
  // Update time range for a specific widget
  const handleWidgetTimeRangeChange = (id: WidgetId, timeRange: TimeRange) => {
    updateWidgetTimeRange(id, timeRange);
  };
  
  // Time range options
  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];
  
  // Get sorted widgets
  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);
  
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-lg flex flex-col h-full">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center">
            <Settings size={20} className="mr-2 text-primary-600" />
            <h2 className="text-lg font-semibold">Dashboard Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Global Time Range</h3>
            <div className="flex items-center space-x-2 mb-4">
              <Clock size={18} className="text-neutral-500" />
              <select
                value={globalTimeRange}
                onChange={(e) => setGlobalTimeRange(e.target.value as TimeRange)}
                className="border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-neutral-500">
              This setting applies to all widgets that use time-based data.
            </p>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium">Widget Arrangement</h3>
              <button
                onClick={resetWidgetSettings}
                className="text-sm flex items-center text-neutral-600 hover:text-primary-600"
              >
                <RotateCcw size={14} className="mr-1" />
                Reset to Default
              </button>
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              Drag and drop to reorder widgets. Toggle visibility with the eye icon.
            </p>
            
            <ul className="space-y-2">
              {sortedWidgets.map((widget) => (
                <li
                  key={widget.id}
                  draggable
                  onDragStart={() => handleDragStart(widget.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(widget.id)}
                  className={`border rounded-md p-3 flex items-center justify-between ${
                    draggedWidget === widget.id ? 'border-primary-500 bg-primary-50' : ''
                  } ${!widget.visible ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center">
                    <MoveVertical size={16} className="mr-3 text-neutral-400 cursor-move" />
                    <span className="font-medium">{widget.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Time range selector for widgets that support it */}
                    {(widget.id === 'salesTrend' || 
                      widget.id === 'customerDemographics' || 
                      widget.id === 'purchaseBehavior') && (
                      <select
                        value={widget.timeRange || globalTimeRange}
                        onChange={(e) => handleWidgetTimeRangeChange(widget.id, e.target.value as TimeRange)}
                        className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {timeRangeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {/* Visibility toggle */}
                    <button
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      className={`p-1 rounded-full ${
                        widget.visible 
                          ? 'text-primary-600 hover:bg-primary-50' 
                          : 'text-neutral-400 hover:bg-neutral-100'
                      }`}
                      title={widget.visible ? 'Hide widget' : 'Show widget'}
                    >
                      {widget.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettings;