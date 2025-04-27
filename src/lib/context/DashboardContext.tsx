'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define widget types
export type WidgetId = 
  | 'orders' 
  | 'products' 
  | 'analytics' 
  | 'salesTrend' 
  | 'customerDemographics' 
  | 'purchaseBehavior' 
  | 'siteSettings' 
  | 'theme' 
  | 'socialMedia'
  | 'activityFeed';

export type TimeRange = 'day' | 'week' | 'month' | 'year';

export interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  order: number;
  title: string;
  description?: string;
  timeRange?: TimeRange;
}

interface DashboardContextType {
  widgets: WidgetConfig[];
  updateWidgetVisibility: (id: WidgetId, visible: boolean) => void;
  updateWidgetOrder: (widgets: WidgetConfig[]) => void;
  updateWidgetTimeRange: (id: WidgetId, timeRange: TimeRange) => void;
  resetWidgetSettings: () => void;
  globalTimeRange: TimeRange;
  setGlobalTimeRange: (range: TimeRange) => void;
}

const defaultWidgets: WidgetConfig[] = [
  { id: 'orders', visible: true, order: 0, title: 'Orders' },
  { id: 'products', visible: true, order: 1, title: 'Products' },
  { id: 'analytics', visible: true, order: 2, title: 'Analytics' },
  { id: 'salesTrend', visible: true, order: 3, title: 'Sales Trend', timeRange: 'week' },
  { id: 'customerDemographics', visible: true, order: 4, title: 'Customer Demographics', timeRange: 'month' },
  { id: 'purchaseBehavior', visible: true, order: 5, title: 'Purchase Behavior', timeRange: 'month' },
  { id: 'siteSettings', visible: true, order: 6, title: 'Site Settings' },
  { id: 'theme', visible: true, order: 7, title: 'Theme' },
  { id: 'socialMedia', visible: true, order: 8, title: 'Social Media' },
  { id: 'activityFeed', visible: true, order: 9, title: 'Activity Feed' },
];

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgets);
  const [globalTimeRange, setGlobalTimeRange] = useState<TimeRange>('week');

  // Load saved widget configuration from localStorage on initial render
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboardWidgets');
    const savedTimeRange = localStorage.getItem('dashboardGlobalTimeRange');
    
    if (savedWidgets) {
      try {
        setWidgets(JSON.parse(savedWidgets));
      } catch (error) {
        console.error('Failed to parse saved dashboard widgets:', error);
        setWidgets(defaultWidgets);
      }
    }

    if (savedTimeRange) {
      try {
        setGlobalTimeRange(savedTimeRange as TimeRange);
      } catch (error) {
        console.error('Failed to parse saved dashboard time range:', error);
        setGlobalTimeRange('week');
      }
    }
  }, []);

  // Save widget configuration to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardWidgets', JSON.stringify(widgets));
  }, [widgets]);

  // Save global time range to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardGlobalTimeRange', globalTimeRange);
  }, [globalTimeRange]);

  const updateWidgetVisibility = (id: WidgetId, visible: boolean) => {
    setWidgets(prevWidgets => 
      prevWidgets.map(widget => 
        widget.id === id ? { ...widget, visible } : widget
      )
    );
  };

  const updateWidgetOrder = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
  };

  const updateWidgetTimeRange = (id: WidgetId, timeRange: TimeRange) => {
    setWidgets(prevWidgets => 
      prevWidgets.map(widget => 
        widget.id === id ? { ...widget, timeRange } : widget
      )
    );
  };

  const resetWidgetSettings = () => {
    setWidgets(defaultWidgets);
    setGlobalTimeRange('week');
  };

  return (
    <DashboardContext.Provider value={{
      widgets,
      updateWidgetVisibility,
      updateWidgetOrder,
      updateWidgetTimeRange,
      resetWidgetSettings,
      globalTimeRange,
      setGlobalTimeRange
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};