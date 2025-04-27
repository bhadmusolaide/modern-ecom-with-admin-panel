'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import MobileNavigation from '@/components/admin/MobileNavigation';
import { ToastProvider } from '@/lib/context/ToastContext';
import { SiteSettingsProvider } from '@/lib/context/SiteSettingsContext';
import { ActivityProvider } from '@/lib/context/ActivityContext';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useFirebaseAuth();

  // Check if user is authenticated and is admin
  useEffect(() => {
    // Use Firebase Auth directly
    if (!authLoading) {
      console.log('Firebase auth loaded, checking status...');
      console.log('User authenticated:', isAuthenticated);
      console.log('User is admin:', isAdmin);

      if (isAuthenticated) {
        if (isAdmin) {
          console.log('User is authenticated and is admin');
          setIsPageLoading(false);
        } else {
          console.log('User is authenticated but not admin, redirecting to home');
          router.push('/');
        }
      } else {
        // No bypass auth - both development and production use Firebase authentication directly
        console.log('User is not authenticated, redirecting to login');
        router.push('/auth/login?from=/admin');
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // Theme is now handled by next-themes

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Show loading state
  if (isPageLoading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-neutral-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-neutral-600 dark:text-gray-300">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <SiteSettingsProvider>
        <ActivityProvider>
          <div className="flex h-screen bg-neutral-50 dark:bg-gray-900">
            {/* Sidebar - hidden on mobile */}
            <AdminSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <AdminHeader toggleSidebar={toggleSidebar} toggleMobileMenu={toggleMobileMenu} />

              <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-6 dark:text-gray-200">
                {children}
              </main>
            </div>

            {/* Mobile Navigation */}
            <MobileNavigation isOpen={isMobileMenuOpen} toggleMenu={toggleMobileMenu} />
          </div>
        </ActivityProvider>
      </SiteSettingsProvider>
    </ToastProvider>
  );
}
