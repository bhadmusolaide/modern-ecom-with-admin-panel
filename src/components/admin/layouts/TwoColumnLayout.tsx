'use client';

import React from 'react';

interface TwoColumnLayoutProps {
  children: React.ReactNode;
  className?: string;
  sidebar: React.ReactNode;
  sidebarWidth?: 'narrow' | 'medium' | 'wide';
  sidebarPosition?: 'left' | 'right';
  gap?: 'none' | 'sm' | 'md' | 'lg';
  stickyHeader?: React.ReactNode;
  stickyFooter?: React.ReactNode;
}

/**
 * Two-column layout with main content and sidebar
 * 
 * @param sidebar - Content for the sidebar
 * @param sidebarWidth - Width of the sidebar: narrow (25%), medium (33%), wide (40%)
 * @param sidebarPosition - Position of the sidebar: left or right
 * @param gap - Gap between columns: none (0), sm (1rem), md (2rem), lg (3rem)
 * @param stickyHeader - Optional sticky header above the content
 * @param stickyFooter - Optional sticky footer below the content
 */
export default function TwoColumnLayout({ 
  children, 
  className = '', 
  sidebar,
  sidebarWidth = 'medium',
  sidebarPosition = 'left',
  gap = 'md',
  stickyHeader,
  stickyFooter
}: TwoColumnLayoutProps) {
  // Define sidebar width classes
  const sidebarWidthClasses = {
    narrow: 'lg:w-1/4',
    medium: 'lg:w-1/3',
    wide: 'lg:w-2/5'
  };

  // Define content width classes (inverse of sidebar width)
  const contentWidthClasses = {
    narrow: 'lg:w-3/4',
    medium: 'lg:w-2/3',
    wide: 'lg:w-3/5'
  };

  // Define gap classes
  const gapClasses = {
    none: 'lg:gap-0',
    sm: 'lg:gap-4',
    md: 'lg:gap-8',
    lg: 'lg:gap-12'
  };

  // Determine order based on sidebar position
  const sidebarOrder = sidebarPosition === 'left' ? 'lg:order-1' : 'lg:order-2';
  const contentOrder = sidebarPosition === 'left' ? 'lg:order-2' : 'lg:order-1';

  return (
    <div className={`w-full ${className}`}>
      {/* Sticky header if provided */}
      {stickyHeader && (
        <div className="sticky top-0 z-10 bg-white border-b border-neutral-200">
          {stickyHeader}
        </div>
      )}
      
      {/* Main content area with sidebar */}
      <div className={`flex flex-col lg:flex-row ${gapClasses[gap]}`}>
        {/* Sidebar */}
        <div className={`w-full ${sidebarWidthClasses[sidebarWidth]} ${sidebarOrder} mb-6 lg:mb-0`}>
          {sidebar}
        </div>
        
        {/* Main content */}
        <div className={`w-full ${contentWidthClasses[sidebarWidth]} ${contentOrder}`}>
          {children}
        </div>
      </div>
      
      {/* Sticky footer if provided */}
      {stickyFooter && (
        <div className="sticky bottom-0 z-10 bg-white border-t border-neutral-200 mt-6">
          {stickyFooter}
        </div>
      )}
    </div>
  );
}