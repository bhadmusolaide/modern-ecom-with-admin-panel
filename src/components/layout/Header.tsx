"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiMenu, FiX, FiUser, FiSearch, FiHeart, FiChevronDown } from 'react-icons/fi';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import { useCart } from '@/lib/context/CartContext';
import CartIcon from '@/components/cart/CartIcon';

// Create the wrapper component to conditionally render the Header
export const HeaderWrapper: React.FC = () => {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isAuthPage = pathname?.startsWith('/auth');

  // Don't render the header on admin or auth pages
  if (isAdminPage || isAuthPage) {
    return null;
  }

  return <Header />;
};

const Header: React.FC = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);
  const { settings } = useSiteSettings();
  const { cart: _ } = useCart(); // Unused but kept for future use
  const submenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Callback ref for menu items
  const setSubmenuRef = useCallback((el: HTMLDivElement | null, itemText: string) => {
    submenuRefs.current[itemText] = el;
  }, []);

  // Determine if header should be transparent
  const isTransparent = settings?.header?.transparent && !isScrolled && pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu when navigating to a new page
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Use menu items from settings if available, otherwise use defaults
  const navItems = settings?.header?.menuItems || [
    { text: 'Home', url: '/' },
    { text: 'Shop', url: '/shop' },
    { text: 'Collections', url: '/collections' },
    { text: 'About', url: '/about' },
    { text: 'FAQs', url: '/faqs' },
    { text: 'Contact', url: '/contact' },
  ];

  // Handle submenu toggle for desktop
  const handleSubmenuToggle = (itemText: string) => {
    setOpenSubmenu(openSubmenu === itemText ? null : itemText);
  };

  // Handle submenu toggle for mobile
  const handleMobileSubmenuToggle = (itemText: string) => {
    setOpenMobileSubmenu(openMobileSubmenu === itemText ? null : itemText);
  };

  // Close submenus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openSubmenu && !Object.values(submenuRefs.current).some(ref => ref?.contains(event.target as Node))) {
        setOpenSubmenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openSubmenu]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md py-2'
          : (isTransparent
              ? 'bg-transparent py-4'
              : 'bg-white py-4')
      }`}
    >
      <div className={`container flex items-center justify-between ${isTransparent ? 'text-white' : 'text-gray-800'}`}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-shrink-0"
        >
          <Link href="/" className={`text-2xl font-bold ${isTransparent ? 'text-white' : 'text-primary-600'}`}>
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings?.siteName || 'OMJ'}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <>{settings?.siteName || 'OMJ'}<span className="text-accent-500">.</span></>
            )}
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item, index) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative group"
              ref={(el) => setSubmenuRef(el, item.text)}
            >
              {item.submenu && item.submenu.length > 0 ? (
                <div>
                  <button
                    onClick={() => handleSubmenuToggle(item.text)}
                    className={`flex items-center font-medium transition-colors ${pathname === item.url || (item.url !== '/' && pathname?.startsWith(item.url)) ? 'text-primary-600' : isTransparent ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-primary-600'}`}
                  >
                    {item.text}
                    <FiChevronDown size={16} className="ml-1" />
                    {(pathname === item.url || (item.url !== '/' && pathname?.startsWith(item.url))) && (
                      <motion.div
                        layoutId={`navIndicator-${item.text}`}
                        className="h-0.5 bg-primary-600 mt-0.5 absolute bottom-0 left-0"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </button>

                  {/* Submenu dropdown */}
                  <AnimatePresence>
                    {(openSubmenu === item.text || (!openSubmenu && item.submenu)) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-50 text-gray-700 ${openSubmenu === item.text ? 'block' : 'hidden group-hover:block'}`}
                      >
                        {item.submenu.map((subitem, subIndex) => (
                          <Link
                            key={subIndex}
                            href={subitem.url}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-600"
                          >
                            {subitem.text}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href={item.url}
                  className={`font-medium transition-colors ${pathname === item.url || (item.url !== '/' && pathname?.startsWith(item.url)) ? 'text-primary-600' : isTransparent ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-primary-600'}`}
                >
                  {item.text}
                  {(pathname === item.url || (item.url !== '/' && pathname?.startsWith(item.url))) && (
                    <motion.div
                      layoutId={`navIndicator-${item.text}`}
                      className="h-0.5 bg-primary-600 mt-0.5"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              )}
            </motion.div>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`${isTransparent ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-primary-600'}`}
            aria-label="Search"
          >
            <FiSearch size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`${isTransparent ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-primary-600'}`}
            aria-label="Favorites"
          >
            <FiHeart size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`${isTransparent ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-primary-600'}`}
            aria-label="Account"
            onClick={() => window.location.href = '/account'}
          >
            <FiUser size={20} />
          </motion.button>
          <CartIcon />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-4">
          <CartIcon />
          <button
            onClick={toggleMobileMenu}
            className={`${isTransparent ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-primary-600'}`}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="container py-4">
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <div key={item.text} className="flex flex-col">
                    {item.submenu && item.submenu.length > 0 ? (
                      <>
                        <button
                          onClick={() => handleMobileSubmenuToggle(item.text)}
                          className={`flex items-center justify-between font-medium transition-colors py-2 w-full text-left ${pathname === item.url || (item.url !== '/' && pathname?.startsWith(item.url)) ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'}`}
                        >
                          <span>{item.text}</span>
                          <FiChevronDown
                            size={16}
                            className={`transition-transform ${openMobileSubmenu === item.text ? 'transform rotate-180' : ''}`}
                          />
                        </button>

                        {/* Mobile submenu */}
                        <AnimatePresence>
                          {openMobileSubmenu === item.text && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="pl-4 mt-1 border-l-2 border-gray-200"
                            >
                              {item.submenu.map((subitem, subIndex) => (
                                <Link
                                  key={subIndex}
                                  href={subitem.url}
                                  className="block py-2 text-sm text-gray-700 hover:text-primary-600"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {subitem.text}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link
                        href={item.url}
                        className={`font-medium transition-colors py-2 ${pathname === item.url || (item.url !== '/' && pathname?.startsWith(item.url)) ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.text}
                        {(pathname === item.url || (item.url !== '/' && pathname?.startsWith(item.url))) && (
                          <div className="h-0.5 w-12 bg-primary-600 mt-1" />
                        )}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
              <div className="mt-4 flex items-center space-x-4">
                <button className="text-gray-700 hover:text-primary-600" aria-label="Search">
                  <FiSearch size={20} />
                </button>
                <button className="text-gray-700 hover:text-primary-600" aria-label="Favorites">
                  <FiHeart size={20} />
                </button>
                <button 
                  className="text-gray-700 hover:text-primary-600" 
                  aria-label="Account"
                  onClick={() => window.location.href = '/account'}
                >
                  <FiUser size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default HeaderWrapper;
