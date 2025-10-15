'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useToast } from './ToastContext';
import { useFirebaseAuth } from '@/lib/firebase';
import { Product, OrderItem, ShippingAddress, ShippingMethod, PaymentMethod, PaymentStatus } from '@/lib/types';

// Define CartItem interface
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedColor?: string;
  selectedSize?: string;
  inventoryStatus?: string;
}

// Define Cart interface
export interface Cart {
  items: CartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
}

// Define shipping address interface
export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// Define shipping method interface
export interface CheckoutShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDelivery?: string;
}

// Define payment method interface
export interface CheckoutPaymentMethod {
  type: 'credit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  cardHolderName?: string;
}

// Define checkout data interface
export interface CheckoutData {
  email: string;
  shippingAddress: CheckoutAddress;
  billingAddress?: CheckoutAddress;
  shippingMethod: CheckoutShippingMethod;
  paymentMethod: CheckoutPaymentMethod;
  notes?: string;
  sameAsBilling: boolean;
}

// Define context type
interface CartContextType {
  cart: Cart;
  isLoading: boolean;
  addToCart: (product: Product, quantity: number, selectedColor?: string, selectedSize?: string, variantId?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateCartItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  checkout: (checkoutData: CheckoutData) => Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }>;
}

// Initial cart state
const initialCart: Cart = {
  items: [],
  subtotal: 0,
  total: 0,
  itemCount: 0
};

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Create provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(initialCart);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingToasts, setPendingToasts] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' }[]>([]);
  const { showToast } = useToast();
  const isProcessingToasts = useRef(false);

  // Load cart from local storage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          // Recompute totals from items to avoid stale persisted totals
          const items = Array.isArray(parsedCart.items) ? parsedCart.items : [];
          const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity || 0)), 0);
          const total = subtotal;
          const itemCount = items.reduce((count: number, item: any) => count + Number(item.quantity || 0), 0);
          setCart({ items, subtotal, total, itemCount });
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isLoading]);

  // Handle pending toasts after render is complete
  useEffect(() => {
    if (pendingToasts.length > 0 && !isProcessingToasts.current) {
      isProcessingToasts.current = true;
      pendingToasts.forEach(toast => {
        showToast(toast.message, toast.type);
      });
      setPendingToasts([]);
      isProcessingToasts.current = false;
    }
  }, [pendingToasts, showToast]);

  // Calculate cart totals whenever items change
  const calculateTotals = (items: CartItem[]): Cart => {
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // You could add tax or shipping calculation here
    const total = subtotal; // For now, total is the same as subtotal

    return {
      items,
      subtotal,
      total,
      itemCount
    };
  };

  // Add product to cart
  const addToCart = (product: Product, quantity: number, selectedColor?: string, selectedSize?: string, variantId?: string) => {
    setCart(prevCart => {
      // Check if the item with the same options already exists in cart
      const existingItemIndex = prevCart.items.findIndex(item =>
        item.productId === product.id &&
        item.variantId === variantId &&
        item.selectedColor === selectedColor &&
        item.selectedSize === selectedSize
      );

      let newItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        newItems = [...prevCart.items];
        newItems[existingItemIndex].quantity += quantity;
      } else {
        // Add new item if it doesn't exist
        const newItem: CartItem = {
          id: `${product.id}_${variantId || ''}_${selectedColor || ''}_${selectedSize || ''}_${Date.now()}`,
          productId: product.id,
          variantId,
          name: product.name,
          price: product.price,
          quantity: quantity,
          image: product.image,
          selectedColor,
          selectedSize,
          inventoryStatus: product.inventoryStatus
        };
        newItems = [...prevCart.items, newItem];
      }

      // Add toast to pending queue instead of calling immediately
      setPendingToasts(prev => [...prev, { message: `Added ${quantity} ${product.name} to cart`, type: 'success' }]);
      return calculateTotals(newItems);
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    let itemToRemove: CartItem | undefined;
    setCart(prevCart => {
      itemToRemove = prevCart.items.find(item => item.id === itemId);
      const newItems = prevCart.items.filter(item => item.id !== itemId);
      return calculateTotals(newItems);
    });
    if (itemToRemove) {
      setPendingToasts(prev => [...prev, { message: `Removed ${itemToRemove!.name} from cart`, type: 'info' }]);
    }
  };

  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }

    setCart(prevCart => {
      const newItems = prevCart.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );

      return calculateTotals(newItems);
    });
  };

  // Update cart item with partial data
  const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
    setCart(prevCart => {
      const newItems = prevCart.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      );

      return calculateTotals(newItems);
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart(initialCart);
    setPendingToasts(prev => [...prev, { message: 'Cart has been cleared', type: 'info' }]);
  };

  // Checkout function
  const { user, getIdToken } = useFirebaseAuth();

  const checkout = async (checkoutData: CheckoutData) => {
    try {
      if (cart.items.length === 0) {
        setPendingToasts(prev => [...prev, { message: 'Your cart is empty', type: 'error' }]);
        return { success: false, error: 'Your cart is empty' };
      }

      // Prepare order items
      const orderItems: OrderItem[] = cart.items.map(item => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        subtotal: item.price * item.quantity,
        inventoryStatus: item.inventoryStatus as any
      }));

      // Prepare shipping address
      const shippingAddress: ShippingAddress = {
        firstName: checkoutData.shippingAddress.firstName,
        lastName: checkoutData.shippingAddress.lastName,
        address: checkoutData.shippingAddress.address,
        city: checkoutData.shippingAddress.city,
        state: checkoutData.shippingAddress.state,
        postalCode: checkoutData.shippingAddress.postalCode,
        country: checkoutData.shippingAddress.country,
        phone: checkoutData.shippingAddress.phone
      };

      // Prepare billing address (same as shipping or custom)
      const billingAddress: ShippingAddress | undefined = checkoutData.sameAsBilling
        ? shippingAddress
        : checkoutData.billingAddress;

      // Prepare shipping method
      const shippingMethod: ShippingMethod = {
        id: checkoutData.shippingMethod.id,
        name: checkoutData.shippingMethod.name,
        price: checkoutData.shippingMethod.price,
        estimatedDelivery: checkoutData.shippingMethod.estimatedDelivery
      };

      // Calculate tax (use 0 here to avoid inconsistencies; tax is handled at checkout UI based on admin settings)
      const tax = 0;

      // Calculate total (subtotal + shipping only; tax handled elsewhere)
      const total = cart.subtotal + shippingMethod.price;

      // Map payment method
      let paymentMethodEnum: PaymentMethod;
      switch (checkoutData.paymentMethod.type) {
        case 'credit_card':
          paymentMethodEnum = PaymentMethod.CREDIT_CARD;
          break;
        case 'paypal':
          paymentMethodEnum = PaymentMethod.PAYPAL;
          break;
        case 'bank_transfer':
          paymentMethodEnum = PaymentMethod.BANK_TRANSFER;
          break;
        case 'cash_on_delivery':
          paymentMethodEnum = PaymentMethod.CASH_ON_DELIVERY;
          break;
        default:
          paymentMethodEnum = PaymentMethod.CREDIT_CARD;
      }

      // Prepare order data
      const orderData = {
        userId: user?.id,
        email: checkoutData.email,
        items: orderItems,
        customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        shippingAddress,
        billingAddress,
        subtotal: cart.subtotal,
        tax,
        shippingCost: shippingMethod.price,
        total,
        shippingMethod,
        payment: {
          method: paymentMethodEnum,
          status: PaymentStatus.PENDING,
          amount: total,
          currency: 'USD',
          ...(paymentMethodEnum === PaymentMethod.CREDIT_CARD && {
            lastFour: checkoutData.paymentMethod.cardNumber?.slice(-4)
          })
        },
        notes: checkoutData.notes ? [
          {
            id: `note_${Date.now()}`,
            message: checkoutData.notes,
            createdAt: new Date().toISOString(),
            createdBy: user?.id || 'guest',
            isCustomerVisible: true
          }
        ] : undefined,
        isGuestOrder: !user,
        requiresShipping: true
      };

      // Call the API to create the order
      const token = await getIdToken();
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        setPendingToasts(prev => [...prev, { message: `Checkout failed: ${errorData.error || 'Unknown error'}`, type: 'error' }]);
        return {
          success: false,
          error: errorData.error || 'Failed to create order'
        };
      }

      const newOrder = await response.json();

      // Clear the cart after successful checkout
      clearCart();

      setPendingToasts(prev => [...prev, { message: 'Order placed successfully!', type: 'success' }]);

      return {
        success: true,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber
      };
    } catch (error) {
      console.error('Error during checkout:', error);
      setPendingToasts(prev => [...prev, { message: 'An error occurred during checkout', type: 'error' }]);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Context value
  const contextValue: CartContextType = {
    cart,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCartItem,
    clearCart,
    checkout
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook for using cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};