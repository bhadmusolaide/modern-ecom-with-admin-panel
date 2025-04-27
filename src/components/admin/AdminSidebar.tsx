'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Layout,
  Palette,
  ShoppingBag,
  Package,
  BarChart,
  ChevronsLeft,
  ChevronsRight,
  Store,
  Globe,
  ServerCog,
  Clock,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  submenu?: { name: string; href: string }[];
  group?: 'Store' | 'Site' | 'System';
}

interface AdminSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function AdminSidebar({ isOpen, toggleSidebar }: AdminSidebarProps) {
  const pathname = usePathname() || '';
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Load collapsed state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('adminSidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard size={20} />,
      group: 'Store'
    },
    {
      name: 'Orders',
      href: '/admin/orders',
      icon: <Package size={20} />,
      submenu: [
        { name: 'All Orders', href: '/admin/orders' },
        { name: 'Analytics', href: '/admin/orders/analytics' },
        { name: 'Export', href: '/admin/orders/export' },
      ],
      group: 'Store'
    },
    {
      name: 'Products',
      href: '/admin/products',
      icon: <ShoppingBag size={20} />,
      submenu: [
        { name: 'All Products', href: '/admin/products' },
        { name: 'Add New', href: '/admin/products/new' },
        { name: 'Categories', href: '/admin/products/categories' },
      ],
      group: 'Store'
    },
    {
      name: 'Customers',
      href: '/admin/customers',
      icon: <Users size={20} />,
      submenu: [
        { name: 'All Customers', href: '/admin/customers' },
        { name: 'Segments', href: '/admin/customers/segments' },
        { name: 'Analytics', href: '/admin/customers/analytics' },
      ],
      group: 'Store'
    },
    {
      name: 'Store Settings',
      href: '/admin/settings/payment',
      icon: <Store size={20} />,
      submenu: [
        { name: 'Payment', href: '/admin/settings/payment' },
        { name: 'Shipping', href: '/admin/settings/shipping' },
      ],
      group: 'Store'
    },
    {
      name: 'Site Customization',
      href: '/admin/site-settings',
      icon: <Globe size={20} />,
      submenu: [
        { name: 'Overview', href: '/admin/site-settings' },
        { name: 'Branding', href: '/admin/site-settings/branding' },
        { name: 'Theme', href: '/admin/site-settings/theme' },
        { name: 'Header', href: '/admin/site-settings/header' },
        { name: 'Footer', href: '/admin/site-settings/footer' },
        { name: 'FAQ', href: '/admin/site-settings/faq' },
        { name: 'Homepage', href: '/admin/site-settings/homepage' },
      ],
      group: 'Site'
    },
    {
      name: 'System',
      href: '/admin/system',
      icon: <ServerCog size={20} />,
      submenu: [
        { name: 'Users', href: '/admin/system/users' },
        { name: 'Logs', href: '/admin/system/logs' },
        { name: 'Backups', href: '/admin/system/backups' },
        { name: 'Admin Tools', href: '/admin/system/tools' },
      ],
      group: 'System'
    },
  ];

  const toggleSubmenu = (name: string) => {
    if (isCollapsed) {
      // If sidebar is collapsed, don't toggle submenu
      return;
    }
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Group menu items by their group property
  const groupedMenuItems: Record<string, MenuItem[]> = {};
  menuItems.forEach(item => {
    const group = item.group || 'Other';
    if (!groupedMenuItems[group]) {
      groupedMenuItems[group] = [];
    }
    groupedMenuItems[group].push(item);
  });

  // Get all unique groups
  const groups = Object.keys(groupedMenuItems);

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{
          x: isOpen ? 0 : -300,
          width: isCollapsed ? 80 : 256 // 64px when collapsed, 256px when expanded
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed inset-y-0 left-0 z-30 bg-white dark:bg-gray-800 shadow-lg transform lg:translate-x-0 lg:static lg:inset-auto lg:z-auto overflow-hidden`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200 dark:border-gray-700">
          <Link href="/admin" className="flex items-center">
            {isCollapsed ? (
              <span className="text-xl font-semibold text-neutral-800 dark:text-gray-200">
                O<span className="text-accent-500">.</span>
              </span>
            ) : (
              <span className="text-xl font-semibold text-neutral-800 dark:text-gray-200">
                Yours<span className="text-accent-500">.</span> Admin
              </span>
            )}
          </Link>
          <div className="flex items-center">
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-md text-neutral-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors hidden lg:block"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
            </button>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md lg:hidden text-neutral-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors ml-2"
              aria-label="Close sidebar"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {groups.map(group => (
            <div key={group} className="space-y-1">
              {/* Group header - only show when not collapsed */}
              {!isCollapsed && (
                <div className="px-4 py-2 text-xs font-semibold text-neutral-400 dark:text-gray-500 uppercase tracking-wider">
                  {group}
                </div>
              )}

              {/* Group divider - show for both collapsed and expanded */}
              <div className="h-px bg-neutral-100 dark:bg-gray-700 my-1"></div>

              {/* Menu items in this group */}
              {groupedMenuItems[group].map((item) => (
                <div key={item.name}>
                  {item.submenu ? (
                    <div>
                      <button
                        onClick={() => toggleSubmenu(item.name)}
                        className={`flex items-center justify-between w-full px-4 py-2 text-sm rounded-md transition-colors ${
                          isActive(item.href)
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            : 'text-neutral-600 dark:text-gray-300 hover:bg-neutral-50 dark:hover:bg-gray-700/50'
                        }`}
                        aria-expanded={openSubmenu === item.name}
                        aria-controls={`submenu-${item.name}`}
                      >
                        <div className="flex items-center min-w-0">
                          <span
                            className={`${isCollapsed ? 'mr-0' : 'mr-3'} ${isActive(item.href) ? 'text-primary-600 dark:text-primary-400' : ''}`}
                            data-tooltip-id={isCollapsed ? `tooltip-${item.name}` : undefined}
                            data-tooltip-content={isCollapsed ? item.name : undefined}
                          >
                            {item.icon}
                          </span>
                          {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </div>
                        {!isCollapsed && (
                          openSubmenu === item.name ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )
                        )}
                      </button>

                      {/* Tooltip for collapsed mode */}
                      {isCollapsed && (
                        <div
                          id={`tooltip-${item.name}`}
                          role="tooltip"
                          className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded shadow-lg opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none"
                          style={{ top: '50%', transform: 'translateY(-50%)' }}
                        >
                          {item.name}
                        </div>
                      )}

                      {/* Submenu - only show when sidebar is expanded */}
                      {!isCollapsed && openSubmenu === item.name && (
                        <div id={`submenu-${item.name}`} className="mt-1 ml-6 space-y-1">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`block px-4 py-2 text-sm rounded-md transition-colors ${
                                isActive(subItem.href)
                                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                  : 'text-neutral-600 dark:text-gray-300 hover:bg-neutral-50 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors relative group ${
                        isActive(item.href)
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-neutral-600 dark:text-gray-300 hover:bg-neutral-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span
                        className={`${isCollapsed ? 'mr-0' : 'mr-3'} ${isActive(item.href) ? 'text-primary-600 dark:text-primary-400' : ''}`}
                      >
                        {item.icon}
                      </span>
                      {!isCollapsed && <span className="truncate">{item.name}</span>}

                      {/* Tooltip for collapsed mode */}
                      {isCollapsed && (
                        <div
                          className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded shadow-lg opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none z-50"
                          style={{ top: '50%', transform: 'translateY(-50%)' }}
                        >
                          {item.name}
                        </div>
                      )}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>
      </motion.aside>
    </>
  );
}
