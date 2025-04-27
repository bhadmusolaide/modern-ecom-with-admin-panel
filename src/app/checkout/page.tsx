'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiLock, FiAlertTriangle, FiUserPlus } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';
import { useToast } from '@/lib/context/ToastContext';
import { validateOrderInventory } from '@/lib/firebase/inventory';
import { InventoryStatus } from '@/lib/types';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, clearCart, updateCartItem } = useCart();
  const { showToast } = useToast();
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingInventory, setIsValidatingInventory] = useState(false);
  const [orderCreated, setOrderCreated] = useState<string | null>(null);
  const [inventoryIssues, setInventoryIssues] = useState<{
    invalidItems: { productId: string; variantId?: string; available: number; requested: number; name?: string }[];
    backorderedItems: { productId: string; variantId?: string; available: number; backordered: number; name?: string }[];
  }>({
    invalidItems: [],
    backorderedItems: []
  });

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'US',
    paymentMethod: 'credit-card',
    acceptBackorders: true
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validate inventory when component mounts
  useEffect(() => {
    const validateInventory = async () => {
      if (cart.items.length === 0) return;

      setIsValidatingInventory(true);

      try {
        // Prepare items for validation
        const itemsToValidate = cart.items.map(item => ({
          productId: item.productId, // Use productId instead of id
          variantId: item.variantId,
          quantity: item.quantity
        }));

        const validationResult = await validateOrderInventory(itemsToValidate);

        // Add product names to the validation results for better UX
        const invalidItemsWithNames = validationResult.invalidItems.map(item => {
          const cartItem = cart.items.find(i => i.productId === item.productId && i.variantId === item.variantId);
          return { ...item, name: cartItem?.name };
        });

        const backorderedItemsWithNames = validationResult.backorderedItems.map(item => {
          const cartItem = cart.items.find(i => i.productId === item.productId && i.variantId === item.variantId);
          return { ...item, name: cartItem?.name };
        });

        setInventoryIssues({
          invalidItems: invalidItemsWithNames,
          backorderedItems: backorderedItemsWithNames
        });

        // Show toast if there are inventory issues
        if (invalidItemsWithNames.length > 0) {
          showToast('Some items in your cart are out of stock or have insufficient quantity', 'error');
        } else if (backorderedItemsWithNames.length > 0) {
          showToast('Some items in your cart will be backordered', 'warning');
        }
      } catch (error) {
        console.error('Error validating inventory:', error);
        showToast('Error validating inventory. Please try again.', 'error');
      } finally {
        setIsValidatingInventory(false);
      }
    };

    validateInventory();
  }, [cart.items, showToast]);

  // Check for returning from signup
  useEffect(() => {
    const returnedFromSignup = searchParams.get('returnFromSignup');
    const savedOrderId = searchParams.get('orderId');

    if (returnedFromSignup === 'true' && savedOrderId) {
      setOrderCreated(savedOrderId);
      // Redirect to payment page with the order ID
      router.push(`/checkout/payment?orderId=${savedOrderId}`);
    }
  }, [searchParams, router]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.address) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Check for inventory issues
    if (inventoryIssues.invalidItems.length > 0) {
      showToast('Please remove out-of-stock items from your cart before proceeding', 'error');
      return;
    }

    // Check if user accepts backorders
    if (inventoryIssues.backorderedItems.length > 0 && !formData.acceptBackorders) {
      showToast('Please accept backorders or remove backordered items from your cart', 'error');
      return;
    }

    // Start submission
    setIsSubmitting(true);

    try {
      // Prepare order data
      const orderData = {
        customerName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        items: cart.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          subtotal: item.price * item.quantity
        })),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          phone: formData.phone || ''
        },
        shippingMethod: {
          id: 'standard-shipping',
          name: 'Standard Shipping',
          price: 0 // Free shipping
        },
        subtotal: cart.subtotal,
        tax: cart.subtotal * 0.08, // 8% tax rate
        shippingCost: 0, // Free shipping
        discount: 0,
        total: cart.subtotal + (cart.subtotal * 0.08),
        payment: {
          method: formData.paymentMethod,
          status: 'PENDING',
          provider: 'MANUAL',
          amount: cart.subtotal + (cart.subtotal * 0.08),
          currency: 'USD'
        },
        isGuestOrder: !user,
        userId: user?.id || null,
        requiresShipping: true
      };

      // Create the order in the database
      console.log('Sending order data to API:', JSON.stringify(orderData, null, 2));
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user ? `Bearer ${user.token}` : ''
        },
        body: JSON.stringify(orderData)
      });

      const responseText = await response.text();
      console.log('API response text:', responseText);

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || 'Failed to create order');
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          throw new Error(`Failed to create order: ${response.status} ${response.statusText}`);
        }
      }

      let newOrder;
      try {
        newOrder = JSON.parse(responseText);
        console.log('Order created successfully:', newOrder);
      } catch (parseError) {
        console.error('Error parsing success response:', parseError);
        throw new Error('Failed to parse order response');
      }

      // Show success message
      showToast('Order placed successfully!', 'success');

      // Clear cart
      clearCart();

      // Store the order ID in localStorage as a fallback
      console.log('Storing order data in localStorage:', newOrder.id);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('lastOrderId', newOrder.id);
          localStorage.setItem('lastOrderData', JSON.stringify(newOrder));
          console.log('Order data successfully stored in localStorage');
        } catch (storageError) {
          console.error('Error storing order data in localStorage:', storageError);
        }
      }

      // Force a small delay to ensure the localStorage is set before navigation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Store the order ID for later use
      setOrderCreated(newOrder.id);

      // If user is not logged in, redirect to signup page
      if (!user) {
        // Save checkout data in localStorage to restore after signup
        localStorage.setItem('checkoutData', JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          orderId: newOrder.id
        }));

        // Redirect to signup page with return URL
        router.push(`/auth/signup?returnTo=${encodeURIComponent(`/checkout?returnFromSignup=true&orderId=${newOrder.id}`)}`);
      } else {
        // If user is logged in, proceed to payment
        router.push(`/checkout/payment?orderId=${encodeURIComponent(newOrder.id)}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showToast('Error placing order. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  // If cart is empty, redirect to cart page
  if (cart.items.length === 0 && !isSubmitting) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <p className="text-gray-600 mb-8">Your cart is empty. Add items to your cart before checking out.</p>
        <Link
          href="/shop"
          className="bg-primary-600 text-white px-6 py-2 rounded-md font-medium hover:bg-primary-700 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <Link
          href="/cart"
          className="text-gray-500 hover:text-gray-800 flex items-center transition-colors"
        >
          <FiChevronLeft className="mr-1" /> Back to Cart
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {cart.items.map(item => (
                <div key={item.id} className="flex items-start py-3 border-b border-gray-100 last:border-0">
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
                    <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {item.quantity} × ${item.price.toFixed(2)}
                      </span>
                      <span className="mx-1 text-gray-300">|</span>
                      <span className="text-xs text-gray-500">
                        {item.selectedSize && `Size: ${item.selectedSize}`}
                        {item.selectedSize && item.selectedColor && ', '}
                        {item.selectedColor && `Color: ${item.selectedColor}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${(cart.subtotal * 0.08).toFixed(2)}</span>
              </div>
              <div className="h-px bg-gray-200 my-4"></div>
              <div className="flex justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">${(cart.subtotal + cart.subtotal * 0.08).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <form onSubmit={handleSubmit}>
              {/* Contact Information */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Payment Method</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="credit-card"
                      name="paymentMethod"
                      value="credit-card"
                      checked={formData.paymentMethod === 'credit-card'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="credit-card" className="ml-2 text-gray-700">
                      Credit Card
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="paypal"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === 'paypal'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="paypal" className="ml-2 text-gray-700">
                      PayPal
                    </label>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500 flex items-center">
                  <FiLock className="mr-1" size={14} />
                  Your payment information is processed securely.
                </div>
              </div>

              {/* Inventory Warnings */}
              {(inventoryIssues.invalidItems.length > 0 || inventoryIssues.backorderedItems.length > 0) && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Inventory Status</h3>

                  {/* Out of Stock Items */}
                  {inventoryIssues.invalidItems.length > 0 && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-start">
                        <FiAlertTriangle className="text-red-500 mt-0.5 mr-2" size={18} />
                        <div>
                          <h4 className="font-medium text-red-800">Out of Stock Items</h4>
                          <p className="text-sm text-red-700 mb-2">
                            The following items are out of stock or have insufficient quantity:
                          </p>
                          <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                            {inventoryIssues.invalidItems.map((item, index) => (
                              <li key={`${item.productId}-${item.variantId || ''}-${index}`}>
                                {item.name} - Available: {item.available}, Requested: {item.requested}
                              </li>
                            ))}
                          </ul>
                          <p className="text-sm text-red-700 mt-2">
                            Please remove these items from your cart or reduce the quantity to proceed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Backordered Items */}
                  {inventoryIssues.backorderedItems.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-start">
                        <FiAlertTriangle className="text-amber-500 mt-0.5 mr-2" size={18} />
                        <div>
                          <h4 className="font-medium text-amber-800">Backordered Items</h4>
                          <p className="text-sm text-amber-700 mb-2">
                            The following items will be backordered:
                          </p>
                          <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
                            {inventoryIssues.backorderedItems.map((item, index) => (
                              <li key={`${item.productId}-${item.variantId || ''}-${index}`}>
                                {item.name} - {item.available} available now, {item.backordered} will be backordered
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3 flex items-center">
                            <input
                              type="checkbox"
                              id="acceptBackorders"
                              name="acceptBackorders"
                              checked={formData.acceptBackorders}
                              onChange={(e) => setFormData(prev => ({ ...prev, acceptBackorders: e.target.checked }))}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-amber-300 rounded"
                            />
                            <label htmlFor="acceptBackorders" className="ml-2 text-sm text-amber-700">
                              I understand and accept that some items will be backordered and shipped when available
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isValidatingInventory ||
                    inventoryIssues.invalidItems.length > 0 ||
                    (inventoryIssues.backorderedItems.length > 0 && !formData.acceptBackorders)
                  }
                  className={`w-full py-3 bg-primary-600 text-white font-medium rounded-md ${
                    isSubmitting || isValidatingInventory ||
                    inventoryIssues.invalidItems.length > 0 ||
                    (inventoryIssues.backorderedItems.length > 0 && !formData.acceptBackorders)
                      ? 'opacity-70 cursor-not-allowed'
                      : 'hover:bg-primary-700'
                  }`}
                >
                  {isSubmitting
                    ? 'Processing...'
                    : isValidatingInventory
                      ? 'Validating Inventory...'
                      : 'Place Order'
                  }
                </button>
                <p className="mt-4 text-center text-sm text-gray-500">
                  By placing your order, you agree to our {' '}
                  <Link href="/terms" className="text-primary-600 hover:text-primary-700">
                    Terms and Conditions
                  </Link>{' '}
                  and {' '}
                  <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}