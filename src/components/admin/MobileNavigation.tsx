'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Settings,
  Users,
  Globe,
  Menu
} from 'lucide-react';

interface MobileNavigationProps {
  isOpen: boolean;
  toggleMenu: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, toggleMenu }) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Navigation items for the bottom bar
  const bottomNavItems = [
    { name: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Products', href: '/admin/products', icon: <ShoppingBag size={20} /> },
    { name: 'Orders', href: '/admin/orders', icon: <Package size={20} /> },
    { name: 'Customers', href: '/admin/customers', icon: <Users size={20} /> },
    { name: 'More', href: '#', icon: <Menu size={20} />, action: toggleMenu }
  ];

  // Full navigation items for the slide-out menu
  const fullNavItems = [
    { name: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Products', href: '/admin/products', icon: <ShoppingBag size={20} /> },
    { name: 'Orders', href: '/admin/orders', icon: <Package size={20} /> },
    { name: 'Customers', href: '/admin/customers', icon: <Users size={20} /> },
    { name: 'Store Settings', href: '/admin/settings/payment', icon: <Settings size={20} /> },
    { name: 'Site Customization', href: '/admin/site-settings', icon: <Globe size={20} /> },
    { name: 'Users', href: '/admin/system/users', icon: <Users size={20} /> },
  ];

  return (
    <>
      {/* Bottom Navigation Bar - Always visible on mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 lg:hidden">
        <div className="flex justify-around">
          {bottomNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.action ? '#' : item.href}
              onClick={item.action}
              className={`flex flex-col items-center py-2 px-3 ${
                isActive(item.href) && !item.action
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Full-screen slide-out menu */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleMenu}
        />
      )}

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="fixed top-0 right-0 bottom-0 w-3/4 bg-white dark:bg-gray-800 z-50 lg:hidden overflow-y-auto"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-gray-200">Menu</h2>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {fullNavItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-3 rounded-md ${
                    isActive(item.href)
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={toggleMenu}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </motion.div>
    </>
  );
};

export default MobileNavigation;
