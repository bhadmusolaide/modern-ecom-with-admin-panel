'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

interface PageWrapperProps {
  children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  const pathname = usePathname();
  
  // Don't add padding to the homepage, admin pages, or auth pages
  const shouldAddPadding = pathname !== '/' && !pathname?.startsWith('/admin') && !pathname?.startsWith('/auth');
  
  return (
    <div className={shouldAddPadding ? 'pt-16' : ''}>
      {children}
    </div>
  );
};

export default PageWrapper;
