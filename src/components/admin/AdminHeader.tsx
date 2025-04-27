'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, User, Menu, LogOut, Settings, ChevronsLeft, ChevronsRight, Home, Clock } from 'lucide-react';
import { useFirebaseAuth } from '@/lib/firebase';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface AdminHeaderProps {
  toggleSidebar: () => void;
  toggleMobileMenu?: () => void;
}

export default function AdminHeader({ toggleSidebar, toggleMobileMenu }: AdminHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{type: string; name: string; url: string}>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const router = useRouter();
  const pathname = usePathname() || '';
  const { user, logout } = useFirebaseAuth();

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('adminSidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // Toggle sidebar collapsed state
  const toggleCollapsedState = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', newState.toString());
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      // Perform search across different collections
      const performSearch = async () => {
        try {
          // Import Firebase modules
          const { collection, query: fbQuery, where, limit, getDocs, or } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase/config');

          // Search products
          const productsQuery = fbQuery(
            collection(db, 'products'),
            where('name', '>=', query),
            where('name', '<=', query + '\uf8ff'),
            limit(3)
          );

          // Search orders
          const ordersQuery = fbQuery(
            collection(db, 'orders'),
            where('orderNumber', '>=', query.toUpperCase()),
            where('orderNumber', '<=', query.toUpperCase() + '\uf8ff'),
            limit(3)
          );

          // Execute queries
          const [productsSnapshot, ordersSnapshot] = await Promise.all([
            getDocs(productsQuery),
            getDocs(ordersQuery)
          ]);

          // Process results
          const results = [];

          // Add product results
          productsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            results.push({
              type: 'product',
              name: data.name || 'Unnamed Product',
              url: `/admin/products/${doc.id}`
            });
          });

          // Add order results
          ordersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            results.push({
              type: 'order',
              name: `Order ${data.orderNumber || doc.id}`,
              url: `/admin/orders/${doc.id}`
            });
          });

          // Add settings links if query matches
          if ('settings'.includes(query.toLowerCase())) {
            results.push({ type: 'setting', name: 'Site Settings', url: '/admin/site-settings' });
          }
          if ('payment'.includes(query.toLowerCase())) {
            results.push({ type: 'setting', name: 'Payment Settings', url: '/admin/site-settings/payment' });
          }

          setSearchResults(results);
          setShowSearchResults(results.length > 0);
        } catch (error) {
          console.error('Error performing search:', error);
          setSearchResults([]);
          setShowSearchResults(false);
        }
      };

      performSearch();
    } else {
      setShowSearchResults(false);
    }
  };

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    if (!pathname || pathname === '/admin') return null;

    const pathSegments = pathname.split('/').filter(Boolean);

    // Skip the first segment which is 'admin'
    const breadcrumbs = pathSegments.slice(1).map((segment, index) => {
      // Create the URL for this breadcrumb
      const url = `/${pathSegments.slice(0, index + 2).join('/')}`;

      // Format the segment name (capitalize first letter, replace hyphens with spaces)
      const name = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());

      return { name, url };
    });

    return (
      <div className="flex items-center text-sm text-neutral-500">
        <a href="/admin" className="flex items-center hover:text-primary-600 transition-colors">
          <Home size={14} className="mr-1" />
          <span>Admin</span>
        </a>

        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.url} className="flex items-center">
            <span className="mx-2">/</span>
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-neutral-700">{crumb.name}</span>
            ) : (
              <a href={crumb.url} className="hover:text-primary-600 transition-colors">
                {crumb.name}
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 h-16 px-6 flex items-center">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <button
            className="lg:hidden mr-4 text-neutral-500 hover:text-primary-600 transition-colors"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>

          {/* Sidebar collapse button removed */}

          {/* Breadcrumbs */}
          <div className="hidden md:block mr-4">
            {generateBreadcrumbs()}
          </div>

          {/* Search */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length > 2 && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              className="w-64 pl-10 pr-4 h-10 rounded-md border border-neutral-200 dark:border-gray-700 bg-neutral-50 dark:bg-gray-700 text-neutral-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-gray-400"
            />

            {/* Search results dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg py-2 z-10 border border-neutral-200 dark:border-gray-700 max-h-80 overflow-y-auto">
                <div className="px-4 py-1 text-xs font-semibold text-neutral-400 dark:text-gray-400 uppercase">
                  Search Results
                </div>
                {searchResults.map((result, index) => (
                  <a
                    key={index}
                    href={result.url}
                    className="block px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-neutral-700 dark:text-gray-200">{result.name}</div>
                    <div className="text-xs text-neutral-500 dark:text-gray-400 capitalize">{result.type}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4 h-full">
          {/* Mobile menu button - visible only on mobile */}
          {toggleMobileMenu && (
            <button
              className="md:hidden text-neutral-500 hover:text-primary-600 transition-colors"
              onClick={toggleMobileMenu}
              aria-label="Open mobile menu"
            >
              <Menu size={24} />
            </button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle className="text-neutral-500 hover:text-primary-600" />

          {/* Notification Center */}
          <NotificationCenter />

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center h-10 text-neutral-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
            >
              <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-gray-700 flex items-center justify-center">
                <User size={18} className="dark:text-gray-300" />
              </div>
              <span className="ml-2 hidden md:block">{user?.name || 'Admin'}</span>
            </button>

            {isProfileOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-neutral-200 dark:border-gray-700"
                role="menu"
              >
                <a
                  href="/admin/profile"
                  className="block px-4 py-2 text-sm text-neutral-700 dark:text-gray-200 hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors"
                  role="menuitem"
                >
                  Your Profile
                </a>
                <a
                  href="/admin/activity"
                  className="block px-4 py-2 text-sm text-neutral-700 dark:text-gray-200 hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors"
                  role="menuitem"
                >
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2" />
                    Activity History
                  </div>
                </a>
                <a
                  href="/admin/settings"
                  className="block px-4 py-2 text-sm text-neutral-700 dark:text-gray-200 hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors"
                  role="menuitem"
                >
                  Settings
                </a>
                <button
                  onClick={() => {
                    // Use Promise chaining instead of async/await to avoid Promise leaking into URL
                    logout()
                      .then(() => {
                        router.push('/auth/login');
                      })
                      .catch((error) => {
                        console.error('Error logging out:', error);
                      });
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center"
                  role="menuitem"
                >
                  <LogOut size={16} className="mr-2" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
