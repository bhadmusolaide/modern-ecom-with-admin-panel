'use client';

import { useState, useEffect, use } from 'react';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  TruckIcon,
  RefreshCw,
  AlertCircle,
  Edit,
  Trash,
  Send,
  ExternalLink,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  DollarSign,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Order, OrderStatus, PaymentStatus } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import RefundPanel from './RefundPanel';
import { withAdminPage } from '@/lib/auth/withAdminPage';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { useToast } from '@/lib/context/ToastContext';

// Safe wrapper for params
function ParamsWrapper(props: { params: Promise<{ id: string }> }) {
  // Use the hook directly without try/catch
  const params = use(props.params);
  return <OrderDetailPage id={params.id} />;
}

// Main component that doesn't use the 'use' hook directly
function OrderDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { user, isAdmin, getIdToken } = useFirebaseAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Add note
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isCustomerVisible, setIsCustomerVisible] = useState(false);

  // Status color mapping
  const statusColors = {
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
    [OrderStatus.SHIPPED]: 'bg-indigo-100 text-indigo-800',
    [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [OrderStatus.REFUNDED]: 'bg-purple-100 text-purple-800',
  };

  // Status icon mapping
  const statusIcons = {
    [OrderStatus.PENDING]: <Clock size={16} />,
    [OrderStatus.PROCESSING]: <RefreshCw size={16} />,
    [OrderStatus.SHIPPED]: <TruckIcon size={16} />,
    [OrderStatus.DELIVERED]: <CheckCircle size={16} />,
    [OrderStatus.CANCELLED]: <XCircle size={16} />,
    [OrderStatus.REFUNDED]: <AlertCircle size={16} />,
  };

  // Fetch order details
  const fetchOrder = async () => {
    setLoading(true);
    setError(null);

    if (!id) {
      console.error('Cannot fetch order: ID is missing or invalid');
      setError('Invalid order ID. Please go back to the orders list and try again.');
      setLoading(false);
      return;
    }

    try {
      // DIRECT APPROACH: Skip the API and go straight to Firestore
      // Import Firebase modules
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');

      console.log('Order detail page: Trying direct Firestore access first');

      try {
        // Get the order document directly from Firestore
        const orderRef = doc(db, 'orders', id);
        const orderDoc = await getDoc(orderRef);

        if (orderDoc.exists()) {
          // Convert the document to an order object and sanitize data
          const rawData = orderDoc.data();

          // Sanitize dates to ensure they are valid
          const sanitizeDate = (dateStr: any): string => {
            if (!dateStr) return new Date().toISOString(); // Default to current date

            try {
              const date = new Date(dateStr);
              return isNaN(date.getTime()) ? new Date().toISOString() : dateStr;
            } catch (e) {
              return new Date().toISOString();
            }
          };

          const orderData = {
            id: orderDoc.id,
            ...rawData,
            createdAt: sanitizeDate(rawData.createdAt),
            updatedAt: sanitizeDate(rawData.updatedAt),
            payment: {
              ...(rawData.payment || {}),
              datePaid: rawData.payment?.datePaid ? sanitizeDate(rawData.payment.datePaid) : undefined,
              dateRefunded: rawData.payment?.dateRefunded ? sanitizeDate(rawData.payment.dateRefunded) : undefined
            },
            notes: Array.isArray(rawData.notes) ? rawData.notes.map(note => ({
              ...note,
              createdAt: sanitizeDate(note.createdAt)
            })) : []
          };

          console.log('Order detail page: Successfully fetched order directly from Firestore');
          setOrder(orderData as Order);
          return;
        } else {
          console.log(`Order detail page: Order ${id} not found in Firestore`);
          setError(`Order with ID ${id} not found. Please check the order ID and try again.`);
        }
      } catch (directFirestoreError) {
        console.error('Order detail page: Error with direct Firestore access', directFirestoreError);
        console.error('Error message:', directFirestoreError instanceof Error ? directFirestoreError.message : 'Unknown error');

        // If we get here, try the API as a fallback
        try {
          // Get auth token
          const token = await getIdToken();
          console.log('Order detail page: Got auth token for API request');

          console.log(`Order detail page: Trying API as fallback for order ${id}`);
          const response = await fetch(`/api/orders/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            console.error(`Order detail page: API error ${response.status}: ${response.statusText}`);

            // Try to get more detailed error information from the response
            let errorDetails = '';
            try {
              const errorData = await response.json();
              console.error('Order detail page: API error details:', errorData);
              errorDetails = errorData.details || errorData.message || '';
            } catch (parseError) {
              console.error('Order detail page: Could not parse error response as JSON', parseError);
              try {
                const errorText = await response.text();
                console.error('Order detail page: API error text:', errorText);
                errorDetails = errorText;
              } catch (textError) {
                console.error('Order detail page: Could not get error response as text', textError);
              }
            }

            throw new Error(`Failed to fetch order details: ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ''}`);
          }

          // Parse response as JSON with error handling
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('Order detail page: Error parsing API response as JSON', jsonError);
            throw new Error('Failed to parse API response. The server returned an invalid response.');
          }

          console.log('Order detail page: Successfully fetched order from API');
          setOrder(data);
          return;
        } catch (apiError) {
          console.error('Order detail page: API fallback also failed', apiError);
          throw apiError; // Re-throw to be caught by outer catch
        }
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('Error message:', err instanceof Error ? err.message : String(err));

      // Try to create a new order in Firestore if it doesn't exist
      if (process.env.NODE_ENV === 'development') {
        console.log('Order detail page: Attempting to create order in Firestore');

        try {
          // Import Firebase modules
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase/config');

          // Check if the order already exists
          const orderRef = doc(db, 'orders', id);
          const orderDoc = await getDoc(orderRef);

          if (!orderDoc.exists()) {
            // Create a new order with the given ID
            const newOrder = {
              orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
              customerName: 'Test Customer',
              email: 'test@example.com',
              status: 'PENDING',
              total: 99.99,
              subtotal: 89.99,
              tax: 5.00,
              shippingCost: 5.00,
              discount: 0,
              items: [
                {
                  id: 'item1',
                  productId: 'prod1',
                  name: 'Test Product',
                  price: 89.99,
                  quantity: 1,
                  subtotal: 89.99,
                  image: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg'
                }
              ],
              shippingAddress: {
                firstName: 'Test',
                lastName: 'Customer',
                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                postalCode: '12345',
                country: 'Test Country',
                phone: '555-123-4567'
              },
              payment: {
                method: 'CREDIT_CARD',
                status: 'PAID',
                amount: 99.99,
                currency: 'USD',
                datePaid: new Date().toISOString()
              },
              notes: [
                {
                  id: `note_${Date.now()}`,
                  message: 'Order created for testing purposes',
                  createdAt: new Date().toISOString(),
                  createdBy: user?.uid || 'system',
                  isCustomerVisible: false
                }
              ],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              userId: user?.uid || 'test-user'
            };

            // Add to Firestore
            await setDoc(orderRef, newOrder);
            console.log('Order detail page: Created new order in Firestore');

            // Fetch the newly created order
            fetchOrder();
            return;
          }
        } catch (createError) {
          console.error('Order detail page: Error creating order in Firestore', createError);
        }
      }

      // If we get here, we couldn't create or find the order

      // Check for specific Firebase permission errors
      if (err instanceof Error &&
          (err.message.includes('permission-denied') ||
           err.message.includes('Missing or insufficient permissions'))) {
        setError('Permission denied: You do not have access to this order. Please update your Firestore security rules to allow admin access to the orders collection.');
      } else if (err instanceof Error && err.message.includes('not-found')) {
        setError(`Order with ID "${id}" not found. Please check the order ID and try again.`);
      } else if (err instanceof Error && err.message.includes('Failed to fetch')) {
        // Network or API errors
        setError(`${err.message}. Please check your network connection and try again.`);
      } else {
        setError('Failed to load order details. Please try again.');
      }

      // Create an empty order object with just the ID to prevent null reference errors in the UI
      setOrder({
        id,
        orderNumber: 'Unknown',
        status: 'UNKNOWN',
        items: [],
        total: 0,
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        createdAt: new Date().toISOString()
      } as Order);
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async () => {
    if (!newStatus) return;
    if (!id) {
      toast.error('Cannot update status: Order ID is missing');
      return;
    }

    setUpdatingStatus(true);

    try {
      // Get auth token
      const token = await getIdToken();
      console.log('Order detail page: Got auth token for status update');

      // Try to update via API first
      try {
        console.log(`Order detail page: Updating status for order ${id} to ${newStatus}`);
        const response = await fetch(`/api/orders/${id}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: newStatus,
            note: statusNote || undefined
          })
        });

        if (!response.ok) {
          console.error(`Order detail page: API error ${response.status}: ${response.statusText}`);
          throw new Error(`Failed to update order status: ${response.statusText}`);
        }

        const updatedOrder = await response.json();
        console.log('Order detail page: Successfully updated status via API');
        setOrder(updatedOrder);
        setNewStatus('');
        setStatusNote('');
        toast.success('Order status updated successfully');
      } catch (apiError) {
        console.error('Order detail page: Error updating via API, trying direct Firestore update', apiError);

        // If API fails, try direct Firestore update
        try {
          // Import Firebase modules dynamically to avoid SSR issues
          const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase/config');

          console.log('Order detail page: Updating status directly in Firestore');

          // Update the order document
          await updateDoc(doc(db, 'orders', id), {
            status: newStatus,
            updatedAt: serverTimestamp(),
            notes: order?.notes ? [
              ...order.notes,
              {
                id: `note_${Date.now()}`,
                message: statusNote || `Status changed to ${newStatus}`,
                createdAt: new Date().toISOString(),
                createdBy: user?.uid || 'admin',
                isCustomerVisible: true
              }
            ] : [
              {
                id: `note_${Date.now()}`,
                message: statusNote || `Status changed to ${newStatus}`,
                createdAt: new Date().toISOString(),
                createdBy: user?.uid || 'admin',
                isCustomerVisible: true
              }
            ]
          });

          console.log('Order detail page: Successfully updated status in Firestore');

          // Refresh the order data
          fetchOrder();

          setNewStatus('');
          setStatusNote('');
          toast.success('Order status updated successfully');
        } catch (firestoreError) {
          console.error('Order detail page: Error updating in Firestore', firestoreError);
          throw firestoreError; // Re-throw to be caught by outer catch
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Add a note to the order
  const addNote = async () => {
    if (!noteText) return;
    if (!id) {
      toast.error('Cannot add note: Order ID is missing');
      return;
    }

    setAddingNote(true);

    try {
      // Get auth token
      const token = await getIdToken();
      console.log('Order detail page: Got auth token for adding note');

      // Try to add note via API first
      try {
        console.log(`Order detail page: Adding note to order ${id}`);
        const response = await fetch(`/api/orders/${id}/notes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: noteText,
            isCustomerVisible
          })
        });

        if (!response.ok) {
          console.error(`Order detail page: API error ${response.status}: ${response.statusText}`);
          throw new Error(`Failed to add note: ${response.statusText}`);
        }

        const updatedOrder = await response.json();
        console.log('Order detail page: Successfully added note via API');
        setOrder(updatedOrder);
        setNoteText('');
        setIsCustomerVisible(false);
        toast.success('Note added successfully');
      } catch (apiError) {
        console.error('Order detail page: Error adding note via API, trying direct Firestore update', apiError);

        // If API fails, try direct Firestore update
        try {
          // Import Firebase modules dynamically to avoid SSR issues
          const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase/config');

          console.log('Order detail page: Adding note directly in Firestore');

          // Create a new note
          const newNote = {
            id: `note_${Date.now()}`,
            message: noteText,
            createdAt: new Date().toISOString(),
            createdBy: user?.uid || 'admin',
            isCustomerVisible
          };

          // Update the order document
          await updateDoc(doc(db, 'orders', id), {
            updatedAt: serverTimestamp(),
            notes: order?.notes ? [...order.notes, newNote] : [newNote]
          });

          console.log('Order detail page: Successfully added note in Firestore');

          // Refresh the order data
          fetchOrder();

          setNoteText('');
          setIsCustomerVisible(false);
          toast.success('Note added successfully');
        } catch (firestoreError) {
          console.error('Order detail page: Error adding note in Firestore', firestoreError);
          throw firestoreError; // Re-throw to be caught by outer catch
        }
      }
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Failed to add note. Please try again.');
    } finally {
      setAddingNote(false);
    }
  };

  // Delete order
  const deleteOrder = async () => {
    if (!id) {
      toast.error('Cannot delete order: Order ID is missing');
      return;
    }

    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      // Get auth token
      const token = await getIdToken();
      console.log('Order detail page: Got auth token for deleting order');

      // Try to delete via API first
      try {
        console.log(`Order detail page: Deleting order ${id}`);
        const response = await fetch(`/api/orders/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.error(`Order detail page: API error ${response.status}: ${response.statusText}`);
          throw new Error(`Failed to delete order: ${response.statusText}`);
        }

        console.log('Order detail page: Successfully deleted order via API');
        toast.success('Order deleted successfully');

        // Redirect to orders list
        router.push('/admin/orders');
      } catch (apiError) {
        console.error('Order detail page: Error deleting via API, trying direct Firestore delete', apiError);

        // If API fails, try direct Firestore delete
        try {
          // Import Firebase modules dynamically to avoid SSR issues
          const { doc, deleteDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase/config');

          console.log('Order detail page: Deleting order directly from Firestore');

          // Delete the order document
          await deleteDoc(doc(db, 'orders', id));

          console.log('Order detail page: Successfully deleted order from Firestore');
          toast.success('Order deleted successfully');

          // Redirect to orders list
          router.push('/admin/orders');
        } catch (firestoreError) {
          console.error('Order detail page: Error deleting from Firestore', firestoreError);
          throw firestoreError; // Re-throw to be caught by outer catch
        }
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      toast.error('Failed to delete order. Please try again.');
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user && id) {
      fetchOrder();
    }
  }, [user, id]);

  return (
    <PermissionGuard permissions={['orders:view', 'orders:process']}>
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <div className="flex items-center mb-1">
            <Link href="/admin/orders" className="text-neutral-600 hover:text-neutral-900 mr-2">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">
              {loading ? 'Loading Order...' : `Order ${order?.orderNumber || ''}`}
            </h1>
          </div>
          {order && (
            <p className="text-neutral-600">
              Placed on {formatDate(order.createdAt, undefined, 'Unknown date')}
            </p>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          {order && order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.REFUNDED && (
            <button
              onClick={() => setNewStatus(OrderStatus.CANCELLED)}
              className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
            >
              <XCircle size={18} className="mr-2" />
              Cancel Order
            </button>
          )}
          {isAdmin && order && (
            <button
              onClick={deleteOrder}
              className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-800 rounded-md hover:bg-neutral-200 transition-colors"
            >
              <Trash size={18} className="mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-48 bg-neutral-200 rounded"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-neutral-200 rounded"></div>
              <div className="h-4 w-full bg-neutral-200 rounded"></div>
              <div className="h-4 w-3/4 bg-neutral-200 rounded"></div>
            </div>
            <div className="h-32 w-full bg-neutral-200 rounded"></div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={fetchOrder}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : order ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status and Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-2">Order Status</h2>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                    <span className="mr-1">{statusIcons[order.status]}</span>
                    {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                  </div>
                </div>

                <div className="mt-4 md:mt-0">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    className="px-4 py-2 border border-neutral-300 rounded-md mr-2"
                  >
                    <option value="">Update Status</option>
                    {Object.values(OrderStatus)
                      .filter(status => status !== order.status)
                      .map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={updateOrderStatus}
                    disabled={!newStatus || updatingStatus}
                    className={`px-4 py-2 rounded-md ${
                      !newStatus || updatingStatus
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    } transition-colors`}
                  >
                    {updatingStatus ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>

              {newStatus && (
                <div className="mb-4">
                  <label htmlFor="statusNote" className="block text-sm font-medium text-neutral-700 mb-1">
                    Add a note about this status change (optional)
                  </label>
                  <textarea
                    id="statusNote"
                    rows={2}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md"
                    placeholder="e.g., Package shipped via UPS"
                  ></textarea>
                </div>
              )}

              {order.payment.status === PaymentStatus.PAID && order.status !== OrderStatus.REFUNDED && (
                <RefundPanel orderId={order.id} onRefund={fetchOrder} />
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">Order Items</h2>
              </div>
              <div className="divide-y divide-neutral-200">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id || `item-${Math.random()}`} className="p-6 flex flex-col md:flex-row">
                      <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 mb-4 md:mb-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                            <Package size={24} className="text-neutral-400" />
                          </div>
                        )}
                      </div>
                      <div className="md:ml-6 flex-grow">
                        <h3 className="text-neutral-900 font-medium">{item.name || 'Unknown Product'}</h3>
                        <div className="mt-1 text-sm text-neutral-600">
                          <span>Quantity: {item.quantity || 1}</span>
                          <span className="mx-2">•</span>
                          <span>Price: {formatCurrency(item.price || 0)}</span>
                        </div>
                        <div className="mt-2 text-neutral-900 font-medium">
                          Subtotal: {formatCurrency(item.subtotal || (item.price * item.quantity) || 0)}
                        </div>
                        {item.options && item.options.length > 0 && (
                          <div className="mt-2 text-sm text-neutral-500">
                            <span className="font-medium">Options:</span>
                            {item.options.map(option => (
                              <span key={`${option.name || 'option'}-${Math.random()}`} className="ml-2">
                                {option.name || 'Option'}: {option.value || ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-neutral-600">
                    No items found in this order
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Shipping</span>
                    <span>{formatCurrency(order.shippingCost || 0)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Tax</span>
                    <span>{formatCurrency(order.tax || 0)}</span>
                  </div>
                  {(order.discount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-900 font-bold pt-2 border-t border-neutral-200">
                    <span>Total</span>
                    <span>{formatCurrency(order.total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            {order.trackingInfo && (
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Tracking Information</h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-32 text-neutral-600">Carrier:</div>
                    <div className="text-neutral-900">{order.trackingInfo.carrier}</div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-32 text-neutral-600">Tracking #:</div>
                    <div className="text-neutral-900">{order.trackingInfo.trackingNumber}</div>
                  </div>
                  {order.trackingInfo.estimatedDeliveryDate && (
                    <div className="flex items-start">
                      <div className="w-32 text-neutral-600">Est. Delivery:</div>
                      <div className="text-neutral-900">
                        {formatDate(order.trackingInfo.estimatedDeliveryDate, undefined, 'Unknown date')}
                      </div>
                    </div>
                  )}
                  {order.trackingInfo.trackingUrl && (
                    <div className="mt-4">
                      <a
                        href={order.trackingInfo.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary-600 hover:text-primary-800"
                      >
                        Track Package <ExternalLink size={16} className="ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Order Notes</h2>

              {order.notes && order.notes.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {order.notes.map((note) => (
                    <div key={note.id} className="bg-neutral-50 p-4 rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-neutral-600">
                          {note.createdBy === 'admin' ? 'Staff' : 'Customer'} • {formatDate(note.createdAt, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }, 'Unknown date')}
                        </div>
                        {!note.isCustomerVisible && (
                          <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            Internal Only
                          </div>
                        )}
                      </div>
                      <div className="text-neutral-900">{note.message}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-neutral-600 mb-6">No notes for this order yet.</div>
              )}

              <div>
                <h3 className="text-md font-medium text-neutral-900 mb-2">Add a Note</h3>
                <textarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md mb-3"
                  placeholder="Enter your note here..."
                ></textarea>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isCustomerVisible}
                      onChange={(e) => setIsCustomerVisible(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-neutral-700">Visible to customer</span>
                  </label>

                  <button
                    onClick={addNote}
                    disabled={!noteText || addingNote}
                    className={`inline-flex items-center px-4 py-2 rounded-md ${
                      !noteText || addingNote
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    } transition-colors`}
                  >
                    <Send size={16} className="mr-2" />
                    {addingNote ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Customer Information</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <User size={18} className="text-neutral-500 mr-2" />
                  <div className="text-neutral-900">{order.customerName || 'Unknown Customer'}</div>
                </div>
                <div className="flex items-center">
                  <Mail size={18} className="text-neutral-500 mr-2" />
                  <div className="text-neutral-900">{order.email || 'No email provided'}</div>
                </div>
                {order.shippingAddress?.phone && (
                  <div className="flex items-center">
                    <Phone size={18} className="text-neutral-500 mr-2" />
                    <div className="text-neutral-900">{order.shippingAddress.phone}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Shipping Address</h2>
              {order.shippingAddress ? (
                <div className="flex items-start">
                  <MapPin size={18} className="text-neutral-500 mr-2 mt-0.5" />
                  <div>
                    <div className="text-neutral-900">
                      {order.shippingAddress.firstName || ''} {order.shippingAddress.lastName || ''}
                    </div>
                    {order.shippingAddress.address && (
                      <div className="text-neutral-700">{order.shippingAddress.address}</div>
                    )}
                    {order.shippingAddress.address2 && (
                      <div className="text-neutral-700">{order.shippingAddress.address2}</div>
                    )}
                    {(order.shippingAddress.city || order.shippingAddress.state || order.shippingAddress.postalCode) && (
                      <div className="text-neutral-700">
                        {[
                          order.shippingAddress.city,
                          order.shippingAddress.state,
                          order.shippingAddress.postalCode
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {order.shippingAddress.country && (
                      <div className="text-neutral-700">{order.shippingAddress.country}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-neutral-600">No shipping address provided</div>
              )}

              {order.shippingMethod && (
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <div className="text-neutral-900 font-medium">Shipping Method</div>
                  <div className="text-neutral-700">{order.shippingMethod.name}</div>
                  <div className="text-neutral-700">{formatCurrency(order.shippingMethod.price)}</div>
                </div>
              )}
            </div>

            {/* Billing Address */}
            {order.billingAddress ? (
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Billing Address</h2>
                <div className="flex items-start">
                  <MapPin size={18} className="text-neutral-500 mr-2 mt-0.5" />
                  <div>
                    <div className="text-neutral-900">{order.billingAddress.firstName} {order.billingAddress.lastName}</div>
                    <div className="text-neutral-700">{order.billingAddress.address}</div>
                    {order.billingAddress.address2 && (
                      <div className="text-neutral-700">{order.billingAddress.address2}</div>
                    )}
                    <div className="text-neutral-700">
                      {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}
                    </div>
                    <div className="text-neutral-700">{order.billingAddress.country}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Billing Address</h2>
                <div className="text-neutral-600">
                  Same as shipping address
                </div>
              </div>
            )}

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Payment Information</h2>
              <div className="space-y-3">
                {order.payment?.method && (
                  <div className="flex items-center">
                    <CreditCard size={18} className="text-neutral-500 mr-2" />
                    <div className="text-neutral-900">
                      {order.payment.method.replace('_', ' ')}
                    </div>
                  </div>
                )}
                {order.payment?.status && (
                  <div className="flex items-center">
                    <DollarSign size={18} className="text-neutral-500 mr-2" />
                    <div className="text-neutral-900">
                      Status: <span className={
                        order.payment.status === PaymentStatus.PAID
                          ? 'text-green-600'
                          : order.payment.status === PaymentStatus.PENDING
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }>
                        {order.payment.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )}
                {order.payment?.transactionId && (
                  <div className="flex items-start">
                    <div className="w-6 flex-shrink-0 flex justify-center">
                      <span className="text-neutral-500">#</span>
                    </div>
                    <div className="text-neutral-900">
                      Transaction ID: {order.payment.transactionId}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Order Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 flex justify-center">
                    <Calendar size={18} className="text-neutral-500" />
                  </div>
                  <div>
                    <div className="text-neutral-900 font-medium">Order Placed</div>
                    <div className="text-neutral-600 text-sm">
                      {formatDate(order.createdAt, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }, 'Unknown date')}
                    </div>
                  </div>
                </div>

                {order.updatedAt !== order.createdAt && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 flex justify-center">
                      <Edit size={18} className="text-neutral-500" />
                    </div>
                    <div>
                      <div className="text-neutral-900 font-medium">Last Updated</div>
                      <div className="text-neutral-600 text-sm">
                        {formatDate(order.updatedAt, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }, 'Unknown date')}
                      </div>
                    </div>
                  </div>
                )}

                {order.status === OrderStatus.SHIPPED && order.trackingInfo && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 flex justify-center">
                      <TruckIcon size={18} className="text-neutral-500" />
                    </div>
                    <div>
                      <div className="text-neutral-900 font-medium">Shipped</div>
                      <div className="text-neutral-600 text-sm">
                        Via {order.trackingInfo.carrier}
                      </div>
                    </div>
                  </div>
                )}

                {order.status === OrderStatus.DELIVERED && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 flex justify-center">
                      <CheckCircle size={18} className="text-green-500" />
                    </div>
                    <div>
                      <div className="text-neutral-900 font-medium">Delivered</div>
                      {order.trackingInfo?.estimatedDeliveryDate && (
                        <div className="text-neutral-600 text-sm">
                          {formatDate(order.trackingInfo.estimatedDeliveryDate, undefined, 'Unknown date')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center">
          <Package size={48} className="mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">Order Not Found</h3>
          <p className="text-neutral-600 mb-4">
            The order you are looking for does not exist or has been deleted.
          </p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Orders
          </Link>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}

// Export the wrapper component with withAdminPage HOC
export default withAdminPage(ParamsWrapper);
