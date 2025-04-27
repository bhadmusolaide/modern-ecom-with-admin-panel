'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingBag, FiX, FiChevronRight } from 'react-icons/fi';
import { useCart } from '@/lib/context/CartContext';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import { usePathname } from 'next/navigation';

export default function CartIcon() {
  const { cart } = useCart();
  const { settings } = useSiteSettings();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Determine if header should be transparent
  const isTransparent = settings?.header?.transparent && !isScrolled && pathname === '/';

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Animation variants
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.2 }
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`${isTransparent ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-primary-600'} relative`}
        aria-label="Cart"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <FiShoppingBag size={20} />
        {cart.itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {cart.itemCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-lg z-50 overflow-hidden"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">Shopping Cart ({cart.itemCount})</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowDropdown(false)}
              >
                <FiX size={18} />
              </button>
            </div>

            {cart.items.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiShoppingBag className="text-gray-400" size={20} />
                </div>
                <p className="text-gray-500 mb-4">Your cart is empty</p>
                <Link
                  href="/shop"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  onClick={() => setShowDropdown(false)}
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div>
                <div className="max-h-60 overflow-y-auto">
                  {cart.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center p-3 border-b border-gray-100 last:border-b-0">
                      <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-500">
                            {item.quantity} × ${item.price.toFixed(2)}
                          </span>
                          {(item.selectedSize || item.selectedColor) && (
                            <span className="text-xs text-gray-500 ml-2">
                              {item.selectedSize && `Size: ${item.selectedSize}`}
                              {item.selectedSize && item.selectedColor && ', '}
                              {item.selectedColor && `Color: ${item.selectedColor}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <span className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}

                  {cart.items.length > 3 && (
                    <div className="p-3 text-center text-sm text-gray-500">
                      + {cart.items.length - 3} more item(s)
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-600 font-medium">Subtotal</span>
                    <span className="font-medium">${cart.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href="/cart"
                      className="w-full bg-primary-600 text-white py-2 rounded-md text-center font-medium hover:bg-primary-700 transition-colors flex items-center justify-center"
                      onClick={() => setShowDropdown(false)}
                    >
                      View Cart
                    </Link>
                    <Link
                      href="/checkout"
                      className="w-full bg-gray-900 text-white py-2 rounded-md text-center font-medium hover:bg-gray-800 transition-colors flex items-center justify-center"
                      onClick={() => setShowDropdown(false)}
                    >
                      Checkout <FiChevronRight className="ml-1" size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}