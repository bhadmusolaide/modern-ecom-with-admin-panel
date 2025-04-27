'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, ShoppingBag, AlertTriangle, Info, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs, updateDoc, doc, where, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';

// Define notification types
export type NotificationType = 'order' | 'alert' | 'info' | 'system';

// Define notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { user } = useFirebaseAuth();

  // Fetch notifications from Firebase
  useEffect(() => {
    if (!user || !user.id) return; // Guard: only run if user and user.id are defined

    const fetchNotifications = async () => {
      setIsLoading(true);

      try {
        // Query notifications collection
        const notificationsRef = collection(db, 'notifications');
        const notificationsQuery = query(
          notificationsRef,
          where('userId', '==', user.id),
          orderBy('time', 'desc'),
          limit(10)
        );

        const snapshot = await getDocs(notificationsQuery);

        if (snapshot.empty) {
          // If no notifications exist yet, create the collection and add some system notifications
          await createInitialNotifications();
          return;
        }

        // Process notifications
        const notificationData: Notification[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type as NotificationType,
            title: data.title,
            message: data.message,
            time: data.time?.toDate() || new Date(),
            read: data.read || false,
            actionUrl: data.actionUrl,
            actionLabel: data.actionLabel
          };
        });

        setNotifications(notificationData);
        setUnreadCount(notificationData.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Create initial notifications if none exist
    const createInitialNotifications = async () => {
      try {
        // Create a system notification
        const systemNotification = {
          type: 'system',
          title: 'Welcome to Admin Dashboard',
          message: 'You can manage your store from this dashboard.',
          time: Timestamp.now(),
          read: false,
          userId: user?.id
        };

        // Add to Firestore
        const notificationsRef = collection(db, 'notifications');
        await getDocs(notificationsRef); // Ensure collection exists

        const docRef = await addDoc(notificationsRef, systemNotification);

        // Refresh notifications
        fetchNotifications();
      } catch (error) {
        console.error('Error creating initial notifications:', error);
      }
    };

    fetchNotifications();

    // Set up real-time listener for new orders to create notifications
    const setupOrderListener = async () => {
      try {
        const { onSnapshot } = await import('firebase/firestore');

        // Get the most recent order timestamp
        const ordersRef = collection(db, 'orders');
        const recentOrdersQuery = query(
          ordersRef,
          orderBy('createdAt', 'desc'),
          limit(1)
        );

        const snapshot = await getDocs(recentOrdersQuery);
        let lastOrderTime = new Date(0); // Default to epoch

        if (!snapshot.empty) {
          const lastOrder = snapshot.docs[0].data();
          if (lastOrder.createdAt) {
            lastOrderTime = lastOrder.createdAt.toDate ?
              lastOrder.createdAt.toDate() : new Date(lastOrder.createdAt);
          }
        }

        // Listen for new orders
        const newOrdersQuery = query(
          ordersRef,
          where('createdAt', '>', Timestamp.fromDate(lastOrderTime)),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(newOrdersQuery, (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const orderData = change.doc.data();

              // Create notification for new order
              const notification = {
                type: 'order',
                title: 'New Order Received',
                message: `Order #${orderData.orderNumber || change.doc.id} has been placed for ${formatCurrency(orderData.total || 0)}`,
                time: Timestamp.now(),
                read: false,
                actionUrl: `/admin/orders/${change.doc.id}`,
                actionLabel: 'View Order',
                userId: user?.id
              };

              // Add to Firestore
              const notificationsRef = collection(db, 'notifications');
              await addDoc(notificationsRef, notification);

              // Refresh notifications
              fetchNotifications();
            }
          });
        });

        // Clean up listener
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up order listener:', error);
      }
    };

    // Helper function to format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    let unsubscribe: (() => void) | undefined;
    setupOrderListener().then((unsub) => {
      if (typeof unsub === 'function') {
        unsubscribe = unsub;
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  // Import Firebase functions dynamically to avoid SSR issues
  const addDoc = async (collectionRef: any, data: any) => {
    const { addDoc: firebaseAddDoc } = await import('firebase/firestore');
    return firebaseAddDoc(collectionRef, data);
  };

  // Close notification panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      // Update in Firestore
      const notificationRef = doc(db, 'notifications', id);
      await updateDoc(notificationRef, {
        read: true
      });

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      // Get all unread notifications
      const unreadNotifications = notifications.filter(n => !n.read);

      // Update each notification in Firestore
      const updatePromises = unreadNotifications.map(notification =>
        updateDoc(doc(db, 'notifications', notification.id), { read: true })
      );

      await Promise.all(updatePromises);

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Remove notification
  const removeNotification = async (id: string) => {
    try {
      // Delete from Firestore
      const notificationRef = doc(db, 'notifications', id);
      await deleteDoc(notificationRef);

      // Update local state
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  // Filter notifications
  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter(notification => notification.type === activeFilter);

  // Get icon based on notification type
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'order':
        return <ShoppingBag size={16} className="text-blue-500" />;
      case 'alert':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'info':
        return <Info size={16} className="text-primary-500" />;
      case 'system':
        return <Settings size={16} className="text-neutral-500" />;
      default:
        return <Info size={16} />;
    }
  };

  // Format time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className={`relative ${className}`} ref={notificationRef}>
      {/* Notification Bell */}
      <button
        className="relative p-2 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} className="text-neutral-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-neutral-200 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex p-2 border-b border-neutral-200 overflow-x-auto">
              {['all', 'order', 'alert', 'info', 'system'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter as NotificationType | 'all')}
                  className={`px-3 py-1 text-sm rounded-full mr-2 whitespace-nowrap ${
                    activeFilter === filter
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-6 text-center text-neutral-500">
                  No notifications to display
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-neutral-900">
                            {notification.title}
                          </p>
                          <div className="flex items-center ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-neutral-400 hover:text-primary-500"
                                aria-label="Mark as read"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="p-1 text-neutral-400 hover:text-red-500"
                              aria-label="Remove notification"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-neutral-500">
                            {formatTime(notification.time)}
                          </span>
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="text-xs font-medium text-primary-600 hover:text-primary-700"
                            >
                              {notification.actionLabel || 'View'}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 text-center border-t border-neutral-200">
              <a
                href="/admin/notifications"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View all notifications
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}