'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiTrash2, FiChevronLeft, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '@/lib/context/CartContext';
import Button from '@/components/ui/Button';

const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const handleQuantityChange = (itemId: string, delta: number, currentQuantity: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity >= 1) {
      updateQuantity(itemId, newQuantity);
    } else if (newQuantity === 0) {
      // If quantity becomes 0, remove item
      removeFromCart(itemId);
    }
  };

  const router = useRouter();

  const handleCheckout = () => {
    setIsCheckingOut(true);
    // Navigate to the checkout page
    router.push('/checkout');
  };

  // If cart is empty
  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-center mb-8">Your Cart</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShoppingBag className="text-gray-400" size={24} />
          </div>
          <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added any products to your cart yet.</p>
          <Link href="/shop">
            <Button variant="primary" className="mx-auto">
              Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Cart</h1>
        <Link
          href="/shop"
          className="text-gray-500 hover:text-gray-800 flex items-center transition-colors"
        >
          <FiChevronLeft className="mr-1" /> Continue Shopping
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <motion.div
          className="lg:w-2/3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 text-sm font-medium text-gray-500">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-center">Total</div>
            </div>

            {cart.items.map((item) => (
              <motion.div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center"
                variants={itemVariants}
              >
                {/* Product Info */}
                <div className="col-span-1 md:col-span-6 flex items-center space-x-4">
                  <div className="relative w-20 h-20 overflow-hidden rounded bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    {item.selectedSize && (
                      <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>
                    )}
                    {item.selectedColor && (
                      <p className="text-sm text-gray-500">Color: {item.selectedColor}</p>
                    )}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-sm text-red-500 hover:text-red-700 mt-1 flex items-center"
                    >
                      <FiTrash2 className="mr-1" size={14} /> Remove
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-1 md:col-span-2 text-center flex items-center justify-between md:block">
                  <span className="md:hidden text-gray-500">Price:</span>
                  <span className="font-medium">${item.price.toFixed(2)}</span>
                </div>

                {/* Quantity */}
                <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-center">
                  <span className="md:hidden text-gray-500">Quantity:</span>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1, item.quantity)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                    >
                      <FiMinus size={16} />
                    </button>
                    <span className="mx-2 w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1, item.quantity)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="col-span-1 md:col-span-2 text-center flex items-center justify-between md:block">
                  <span className="md:hidden text-gray-500">Total:</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </motion.div>
            ))}

            <div className="p-4 flex justify-between">
              <button
                onClick={clearCart}
                className="text-red-500 hover:text-red-700 flex items-center"
              >
                <FiTrash2 className="mr-2" /> Clear Cart
              </button>
            </div>
          </div>
        </motion.div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <div className="h-px bg-gray-200 my-4"></div>
              <div className="flex justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">${cart.total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={handleCheckout}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
            </Button>

            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">We Accept</h3>
              <div className="flex space-x-2">
                <div className="bg-gray-100 rounded px-2 py-1 text-xs">Visa</div>
                <div className="bg-gray-100 rounded px-2 py-1 text-xs">Mastercard</div>
                <div className="bg-gray-100 rounded px-2 py-1 text-xs">PayPal</div>
                <div className="bg-gray-100 rounded px-2 py-1 text-xs">Apple Pay</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;