'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Tag,
  Edit,
  Save,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Clock
} from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';
import { User as UserType, CustomerSegment, Order } from '@/lib/types';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import {
  updateCustomer,
  setCustomerActiveStatus,
  resetCustomerPassword,
  getCustomerOrders,
  getCustomerSegments,
  calculateCustomerLifetimeValue,
  assignCustomersToSegment,
  removeCustomersFromSegment
} from '@/lib/firebase/customers';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import PageHeader from '@/components/admin/PageHeader';
import Container from '@/components/admin/layouts/Container';
import Section from '@/components/admin/layouts/Section';
import TwoColumnLayout from '@/components/admin/layouts/TwoColumnLayout';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import PermissionGuard from '@/components/admin/PermissionGuard';
import Tabs from '@/components/ui/Tabs';
import PurchaseHistoryChart from '@/components/admin/customers/PurchaseHistoryChart';
import CustomerLifetimeValueChart from '@/components/admin/customers/CustomerLifetimeValueChart';
import { withAdminPage } from '@/lib/auth/withAdminPage';

// Wrapper component to handle params
function ParamsWrapper(props: { params: Promise<{ id: string }> }) {
  const { id } = React.use(props.params);
  return <CustomerDetailPage id={id} />;
}

function CustomerDetailPage({ id }: { id: string }) {
  const { user, isLoading: authLoading, firebaseUser } = useFirebaseAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // State
  const [customer, setCustomer] = useState<UserType | null>(null);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isRetrying, setIsRetrying] = useState(false);
  const [customerExists, setCustomerExists] = useState<boolean | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      phone: ''
    },
    notes: '',
    segment: [] as string[]
  });

  // Check for customer existence on initial load
  useEffect(() => {
    if (!customer && !isLoading && customerExists === null) {
      const checkExistence = async () => {
        try {
          // Get a fresh token directly from Firebase if available
          let token = '';
          if (firebaseUser) {
            try {
              token = await firebaseUser.getIdToken(true);
              console.log('Got fresh token for customer existence check');
            } catch (tokenError) {
              console.error('Error getting token:', tokenError);
            }
          }

          // Make the API request with the token
          const response = await fetch(`/api/admin/customers/${id}/exists`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            }
          });

          const data = await response.json();
          const exists = response.ok && data.exists;
          setCustomerExists(exists);
        } catch (error) {
          console.error('Error checking customer existence:', error);
        }
      };

      checkExistence();
    }
  }, [customer, isLoading, customerExists, id, firebaseUser]);

  // Fetch customer data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log(`Customer detail page: Fetching data for customer ID: ${id}`);

        // First check if the customer exists
        console.log('Checking if customer exists before fetching details');

        // Get a fresh token directly from Firebase if available
        let existsToken = '';
        if (firebaseUser) {
          try {
            existsToken = await firebaseUser.getIdToken(true);
            console.log('Got fresh token for customer existence check');
          } catch (tokenError) {
            console.error('Error getting token:', tokenError);
          }
        }

        // Check if customer exists
        const existsResponse = await fetch(`/api/admin/customers/${id}/exists`, {
          headers: {
            'Authorization': existsToken ? `Bearer ${existsToken}` : ''
          }
        });

        if (!existsResponse.ok) {
          console.error(`Failed to check if customer exists: ${existsResponse.status} ${existsResponse.statusText}`);
          throw new Error(`Failed to check if customer exists: ${existsResponse.status}`);
        }

        const existsData = await existsResponse.json();
        const exists = existsData.exists;
        setCustomerExists(exists);

        if (!exists) {
          console.error(`Customer ID ${id} does not exist in the database`);
          showToast('Customer not found in the database', 'error');
          setIsLoading(false);
          return;
        }

        console.log(`Customer exists, proceeding to fetch details`);

        // Fetch customer with retry logic
        let fetchedCustomer;
        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
          try {
            console.log(`Customer detail page: Attempt ${retryCount + 1} to fetch customer data`);

            // Get a fresh token directly from Firebase if available
            let token = '';
            if (firebaseUser) {
              try {
                token = await firebaseUser.getIdToken(true);
                console.log('Got fresh token for customer API request');
              } catch (tokenError) {
                console.error('Error getting token:', tokenError);
              }
            }

            // Make the API request with the token
            const response = await fetch(`/api/admin/customers/${id}`, {
              headers: {
                'Authorization': token ? `Bearer ${token}` : ''
              }
            });

            if (!response.ok) {
              throw new Error(`Failed to fetch customer: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            fetchedCustomer = data.customer;

            if (fetchedCustomer) {
              console.log(`Customer detail page: Successfully fetched customer:`,
                { id: fetchedCustomer.id, name: fetchedCustomer.name, email: fetchedCustomer.email });
              break;
            }
          } catch (customerError) {
            console.error(`Customer detail page: Error fetching customer (attempt ${retryCount + 1}):`, customerError);

            if (retryCount === maxRetries) {
              throw customerError; // Re-throw on final attempt
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          }

          retryCount++;
        }

        if (!fetchedCustomer) {
          throw new Error('Failed to fetch customer data after multiple attempts');
        }

        // Set customer data
        setCustomer(fetchedCustomer);

        // Initialize form data
        setFormData({
          name: fetchedCustomer.name || '',
          email: fetchedCustomer.email || '',
          phone: fetchedCustomer.phone || '',
          address: fetchedCustomer.address || {
            street: '',
            city: '',
            state: '',
            zip: '',
            country: '',
            phone: ''
          },
          notes: fetchedCustomer.notes || '',
          segment: fetchedCustomer.segment || []
        });

        // Fetch segments
        console.log('Customer detail page: Fetching customer segments');
        try {
          // Get a fresh token directly from Firebase if available
          let segmentsToken = '';
          if (firebaseUser) {
            try {
              segmentsToken = await firebaseUser.getIdToken(true);
              console.log('Got fresh token for segments API request');
            } catch (tokenError) {
              console.error('Error getting token:', tokenError);
            }
          }

          // Make the API request with the token
          const segmentsResponse = await fetch('/api/admin/customer-segments', {
            headers: {
              'Authorization': segmentsToken ? `Bearer ${segmentsToken}` : ''
            }
          });

          if (!segmentsResponse.ok) {
            throw new Error(`Failed to fetch segments: ${segmentsResponse.status} ${segmentsResponse.statusText}`);
          }

          const segmentsData = await segmentsResponse.json();
          const fetchedSegments = segmentsData.segments || [];
          console.log(`Customer detail page: Fetched ${fetchedSegments.length} segments`);
          setSegments(fetchedSegments);
        } catch (segmentsError) {
          console.error('Customer detail page: Error fetching segments:', segmentsError);
          // Don't fail the entire page load if segments can't be fetched
          setSegments([]);
        }

        // Fetch orders with improved error handling
        console.log(`Customer detail page: Fetching orders for customer ID: ${id}`);
        try {
          // Get a fresh token directly from Firebase if available
          let ordersToken = '';
          if (firebaseUser) {
            try {
              ordersToken = await firebaseUser.getIdToken(true);
              console.log('Got fresh token for orders API request');
            } catch (tokenError) {
              console.error('Error getting token:', tokenError);
              console.error('Token error details:', tokenError instanceof Error ? tokenError.message : 'Unknown error');
            }
          }

          console.log('Making API request to fetch orders with token present:', !!ordersToken);

          // Make the API request with the token
          const ordersResponse = await fetch(`/api/admin/customers/${id}/orders`, {
            headers: {
              'Authorization': ordersToken ? `Bearer ${ordersToken}` : '',
              'Content-Type': 'application/json'
            }
          });

          console.log(`Orders API response status: ${ordersResponse.status} ${ordersResponse.statusText}`);

          if (!ordersResponse.ok) {
            // Try to get the error message from the response
            let errorMessage = `Failed to fetch orders: ${ordersResponse.status} ${ordersResponse.statusText}`;
            try {
              const errorData = await ordersResponse.text();
              console.error('Error response body:', errorData);

              // Try to parse as JSON if possible
              try {
                const jsonError = JSON.parse(errorData);
                if (jsonError.error) {
                  errorMessage = `Failed to fetch orders: ${jsonError.error}`;
                }
              } catch (parseError) {
                // If it's not valid JSON, use the text as is
                if (errorData && errorData.length > 0) {
                  errorMessage = `Failed to fetch orders: ${errorData}`;
                }
              }
            } catch (responseError) {
              console.error('Error reading error response:', responseError);
            }

            throw new Error(errorMessage);
          }

          // Parse the JSON response with error handling
          let ordersData;
          try {
            ordersData = await ordersResponse.json();
          } catch (jsonError) {
            console.error('Error parsing orders JSON response:', jsonError);
            throw new Error('Failed to parse orders data from server');
          }

          const fetchedOrders = ordersData.orders || [];
          console.log(`Customer detail page: Fetched ${fetchedOrders.length} orders`);
          setOrders(fetchedOrders);
        } catch (ordersError) {
          console.error('Customer detail page: Error fetching customer orders:', ordersError);
          console.error('Orders error details:', ordersError instanceof Error ? ordersError.message : 'Unknown error');
          console.error('Orders error stack:', ordersError instanceof Error ? ordersError.stack : 'No stack trace');

          // Show toast with error message
          showToast(`Failed to load orders: ${ordersError instanceof Error ? ordersError.message : 'Unknown error'}`, 'error');

          // Don't fail the entire page load if orders can't be fetched
          setOrders([]);
        }

        // Calculate lifetime value if not already set
        if (!fetchedCustomer.totalSpent || !fetchedCustomer.totalOrders) {
          console.log('Customer detail page: Calculating customer lifetime value');
          try {
            // Get a fresh token directly from Firebase if available
            let calcToken = '';
            if (firebaseUser) {
              try {
                calcToken = await firebaseUser.getIdToken(true);
                console.log('Got fresh token for lifetime value API request');
              } catch (tokenError) {
                console.error('Error getting token:', tokenError);
              }
            }

            // Make the API request with the token
            const calcResponse = await fetch(`/api/admin/customers/${id}/lifetime-value`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': calcToken ? `Bearer ${calcToken}` : ''
              },
              body: JSON.stringify({})
            });

            if (!calcResponse.ok) {
              throw new Error(`Failed to calculate lifetime value: ${calcResponse.status} ${calcResponse.statusText}`);
            }

            // Refetch customer to get updated values
            const customerResponse = await fetch(`/api/admin/customers/${id}`, {
              headers: {
                'Authorization': calcToken ? `Bearer ${calcToken}` : ''
              }
            });

            if (customerResponse.ok) {
              const customerData = await customerResponse.json();
              const updatedCustomer = customerData.customer;
              setCustomer(updatedCustomer);
              console.log('Customer detail page: Updated customer with lifetime value data');
            }
          } catch (calcError) {
            console.error('Customer detail page: Error calculating lifetime value:', calcError);
            // Don't fail if we can't calculate lifetime value
          }
        }
      } catch (error) {
        console.error('Customer detail page: Error fetching data:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        showToast('Failed to load customer data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    } else {
      console.error('Customer detail page: No customer ID provided');
      setIsLoading(false);
    }
  }, [id, showToast]);

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle segment selection
  const handleSegmentChange = (segmentId: string) => {
    setFormData(prev => {
      const currentSegments = [...prev.segment];

      if (currentSegments.includes(segmentId)) {
        return {
          ...prev,
          segment: currentSegments.filter(id => id !== segmentId)
        };
      } else {
        return {
          ...prev,
          segment: [...currentSegments, segmentId]
        };
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsProcessing(true);

      // Update customer
      const updatedCustomer = await updateCustomer(id as string, formData);

      // Update segments if changed
      const currentSegments = customer?.segment || [];
      const newSegments = formData.segment;

      // Segments to add (in new but not in current)
      const segmentsToAdd = newSegments.filter(
        segmentId => !currentSegments.includes(segmentId)
      );

      // Segments to remove (in current but not in new)
      const segmentsToRemove = currentSegments.filter(
        segmentId => !newSegments.includes(segmentId)
      );

      if (segmentsToAdd.length > 0) {
        await Promise.all(
          segmentsToAdd.map(segmentId =>
            assignCustomersToSegment([id as string], segmentId)
          )
        );
      }

      if (segmentsToRemove.length > 0) {
        await Promise.all(
          segmentsToRemove.map(segmentId =>
            removeCustomersFromSegment([id as string], segmentId)
          )
        );
      }

      // Update local state
      setCustomer(updatedCustomer);
      setIsEditing(false);

      showToast('Customer updated successfully', 'success');
    } catch (error) {
      console.error('Error updating customer:', error);
      showToast('Failed to update customer', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle customer activation/deactivation
  const handleToggleStatus = async () => {
    if (!customer) return;

    try {
      setIsProcessing(true);

      const newStatus = !customer.isActive;
      await setCustomerActiveStatus(id as string, newStatus);

      // Update local state
      setCustomer(prev => prev ? { ...prev, isActive: newStatus } : null);

      showToast(
        `Customer ${newStatus ? 'activated' : 'deactivated'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling customer status:', error);
      showToast('Failed to update customer status', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!customer) return;

    try {
      setIsProcessing(true);

      await resetCustomerPassword(customer.email);

      showToast(
        'Password reset email sent successfully',
        'success'
      );
    } catch (error) {
      console.error('Error resetting password:', error);
      showToast('Failed to send password reset email', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Define tabs
  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag size={16} /> },
    { id: 'analytics', label: 'Analytics', icon: <DollarSign size={16} /> }
  ];

  // Function to retry loading the customer
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      console.log(`Customer detail page: Manually retrying fetch for customer ID: ${id}`);

      // First check if the customer ID exists in the database
      // Get a fresh token directly from Firebase if available
      let existsToken = '';
      if (firebaseUser) {
        try {
          existsToken = await firebaseUser.getIdToken(true);
          console.log('Got fresh token for customer existence check');
        } catch (tokenError) {
          console.error('Error getting token:', tokenError);
        }
      }

      // Make the API request with the token
      const existsResponse = await fetch(`/api/admin/customers/${id}/exists`, {
        headers: {
          'Authorization': existsToken ? `Bearer ${existsToken}` : ''
        }
      });

      const existsData = await existsResponse.json();
      const exists = existsResponse.ok && existsData.exists;
      setCustomerExists(exists);

      if (!exists) {
        console.error(`Customer detail page: Customer ID ${id} does not exist in the database`);
        showToast('Customer ID does not exist in the database', 'error');
        return;
      }

      // If the customer exists, try to fetch it directly
      // Get a fresh token directly from Firebase if available
      let customerToken = '';
      if (firebaseUser) {
        try {
          customerToken = await firebaseUser.getIdToken(true);
          console.log('Got fresh token for customer API request');
        } catch (tokenError) {
          console.error('Error getting token:', tokenError);
        }
      }

      // Make the API request with the token
      const customerResponse = await fetch(`/api/admin/customers/${id}`, {
        headers: {
          'Authorization': customerToken ? `Bearer ${customerToken}` : ''
        }
      });

      if (!customerResponse.ok) {
        throw new Error(`Failed to fetch customer: ${customerResponse.status} ${customerResponse.statusText}`);
      }

      const customerData = await customerResponse.json();
      const fetchedCustomer = customerData.customer;

      if (fetchedCustomer) {
        setCustomer(fetchedCustomer);

        // Initialize form data
        setFormData({
          name: fetchedCustomer.name || '',
          email: fetchedCustomer.email || '',
          phone: fetchedCustomer.phone || '',
          address: fetchedCustomer.address || {
            street: '',
            city: '',
            state: '',
            zip: '',
            country: '',
            phone: ''
          },
          notes: fetchedCustomer.notes || '',
          segment: fetchedCustomer.segment || []
        });

        showToast('Customer data loaded successfully', 'success');
      }
    } catch (error) {
      console.error('Error retrying customer fetch:', error);
      showToast('Failed to load customer data', 'error');
    } finally {
      setIsRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Container>
    );
  }



  if (!customer) {
    return (
      <Container>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Customer Not Found</h2>
          <p className="text-neutral-600 mb-6">
            We couldn't find the customer with ID: <span className="font-mono bg-neutral-100 px-2 py-1 rounded">{id}</span>
          </p>

          {customerExists === false ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8 max-w-lg mx-auto">
              <p className="text-red-700 font-medium">
                This customer ID does not exist in the database.
              </p>
              <p className="text-red-600 mt-2">
                The ID may be incorrect or the customer record may have been deleted.
              </p>
            </div>
          ) : customerExists === true ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-8 max-w-lg mx-auto">
              <p className="text-yellow-700 font-medium">
                The customer ID exists in the database, but we couldn't load the full customer data.
              </p>
              <p className="text-yellow-600 mt-2">
                This could be due to permission issues or data corruption. Please try again or contact support.
              </p>
            </div>
          ) : (
            <p className="text-neutral-500 mb-8 max-w-lg mx-auto">
              This could be because the customer doesn't exist, has been deleted, or you don't have permission to view it.
              You can try again or return to the customers list.
            </p>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="primary"
              size="md"
              icon={<RefreshCw size={16} className={isRetrying ? "animate-spin" : ""} />}
              iconPosition="left"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? "Retrying..." : "Try Again"}
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<ArrowLeft size={16} />}
              iconPosition="left"
              onClick={() => router.push('/admin/customers')}
              disabled={isRetrying}
            >
              Back to Customers
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <PermissionGuard permissions={['customers:view']}>
      <Container>
        <PageHeader
          title={customer.name || 'Customer Details'}
          description={customer.email}
          showBreadcrumbs={true}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Customers', href: '/admin/customers' },
            { label: customer.name || 'Customer Details', href: `/admin/customers/${id}` }
          ]}
          actions={[
            {
              label: isEditing ? 'Cancel' : 'Edit Customer',
              icon: isEditing ? <XCircle size={16} /> : <Edit size={16} />,
              onClick: () => setIsEditing(!isEditing),
              variant: isEditing ? 'outline' : 'secondary'
            },
            {
              label: customer.isActive ? 'Deactivate' : 'Activate',
              icon: customer.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />,
              onClick: handleToggleStatus,
              variant: customer.isActive ? 'danger' : 'success',
              disabled: isProcessing
            }
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="mb-6"
          />

          {activeTab === 'profile' && (
            <TwoColumnLayout
              sidebar={
                <div className="space-y-6">
                  {/* Customer Summary Card */}
                  <Section>
                    <div className="flex flex-col items-center p-4">
                      <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                        {customer.avatar ? (
                          <img
                            src={customer.avatar}
                            alt={customer.name || 'Customer'}
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-12 w-12 text-neutral-400" />
                        )}
                      </div>
                      <h2 className="text-xl font-semibold text-neutral-900">
                        {customer.name || 'No Name'}
                      </h2>
                      <p className="text-neutral-500">{customer.email}</p>

                      <div className="mt-4 w-full">
                        <div className="flex justify-between py-2 border-b border-neutral-100">
                          <span className="text-neutral-500">Status</span>
                          <span className={`font-medium ${customer.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-neutral-100">
                          <span className="text-neutral-500">Customer Since</span>
                          <span className="font-medium">
                            {customer.createdAt ? formatDate(customer.createdAt) : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-neutral-100">
                          <span className="text-neutral-500">Last Login</span>
                          <span className="font-medium">
                            {customer.lastLoginAt ? formatDate(customer.lastLoginAt) : 'Never'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-neutral-100">
                          <span className="text-neutral-500">Total Orders</span>
                          <span className="font-medium">{customer.totalOrders || 0}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-neutral-500">Total Spent</span>
                          <span className="font-medium">{formatCurrency(customer.totalSpent || 0)}</span>
                        </div>
                      </div>

                      <div className="mt-6 w-full">
                        <Button
                          variant="outline"
                          size="md"
                          icon={<RefreshCw size={16} />}
                          iconPosition="left"
                          className="w-full mb-2"
                          onClick={handleResetPassword}
                          disabled={isProcessing}
                        >
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  </Section>

                  {/* Segments Card */}
                  <Section title="Customer Segments">
                    <div className="p-4">
                      {!isEditing ? (
                        <div className="space-y-2">
                          {customer.segment && customer.segment.length > 0 ? (
                            customer.segment.map(segmentId => {
                              const segment = segments.find(s => s.id === segmentId);
                              return (
                                <div
                                  key={segmentId}
                                  className="flex items-center p-2 bg-blue-50 rounded-md"
                                >
                                  <Tag className="h-4 w-4 mr-2 text-blue-600" />
                                  <span className="text-blue-800">
                                    {segment?.name || segmentId}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-neutral-500 text-sm">
                              This customer is not in any segments.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {segments.map(segment => (
                            <div
                              key={segment.id}
                              className="flex items-center"
                            >
                              <input
                                type="checkbox"
                                id={`segment-${segment.id}`}
                                checked={formData.segment.includes(segment.id)}
                                onChange={() => handleSegmentChange(segment.id)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                              />
                              <label
                                htmlFor={`segment-${segment.id}`}
                                className="ml-2 block text-sm text-neutral-900"
                              >
                                {segment.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Section>
                </div>
              }
            >
              {/* Main Content */}
              <Section title="Customer Information">
                <div className="p-6">
                  {isEditing ? (
                    <form onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Name
                          </label>
                          <Input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Customer name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Email
                          </label>
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="customer@example.com"
                            disabled // Email changes require special handling
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Phone
                          </label>
                          <Input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Phone number"
                          />
                        </div>
                      </div>

                      <h3 className="text-lg font-medium text-neutral-900 mb-4">Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Street
                          </label>
                          <Input
                            type="text"
                            name="address.street"
                            value={formData.address.street}
                            onChange={handleInputChange}
                            placeholder="Street address"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            City
                          </label>
                          <Input
                            type="text"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleInputChange}
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            State/Province
                          </label>
                          <Input
                            type="text"
                            name="address.state"
                            value={formData.address.state}
                            onChange={handleInputChange}
                            placeholder="State or province"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Postal Code
                          </label>
                          <Input
                            type="text"
                            name="address.zip"
                            value={formData.address.zip}
                            onChange={handleInputChange}
                            placeholder="Postal code"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Country
                          </label>
                          <Input
                            type="text"
                            name="address.country"
                            value={formData.address.country}
                            onChange={handleInputChange}
                            placeholder="Country"
                          />
                        </div>
                      </div>

                      <h3 className="text-lg font-medium text-neutral-900 mb-4">Notes</h3>
                      <div className="mb-6">
                        <Textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="Add notes about this customer"
                          rows={4}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="md"
                          className="mr-2"
                          onClick={() => setIsEditing(false)}
                          disabled={isProcessing}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          icon={<Save size={16} />}
                          iconPosition="left"
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h3 className="text-sm font-medium text-neutral-500">Name</h3>
                          <p className="mt-1 text-neutral-900">{customer.name || 'Not provided'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-neutral-500">Email</h3>
                          <p className="mt-1 text-neutral-900">{customer.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-neutral-500">Phone</h3>
                          <p className="mt-1 text-neutral-900">{customer.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      <h3 className="text-lg font-medium text-neutral-900 mb-4">Address</h3>
                      {customer.address ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <h3 className="text-sm font-medium text-neutral-500">Street</h3>
                            <p className="mt-1 text-neutral-900">{customer.address.street || 'Not provided'}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-neutral-500">City</h3>
                            <p className="mt-1 text-neutral-900">{customer.address.city || 'Not provided'}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-neutral-500">State/Province</h3>
                            <p className="mt-1 text-neutral-900">{customer.address.state || 'Not provided'}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-neutral-500">Postal Code</h3>
                            <p className="mt-1 text-neutral-900">{customer.address.zip || 'Not provided'}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-neutral-500">Country</h3>
                            <p className="mt-1 text-neutral-900">{customer.address.country || 'Not provided'}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-neutral-500 mb-6">No address information provided.</p>
                      )}

                      <h3 className="text-lg font-medium text-neutral-900 mb-4">Notes</h3>
                      <div className="bg-neutral-50 p-4 rounded-md mb-6">
                        {customer.notes ? (
                          <p className="text-neutral-700 whitespace-pre-line">{customer.notes}</p>
                        ) : (
                          <p className="text-neutral-500">No notes for this customer.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            </TwoColumnLayout>
          )}

          {activeTab === 'orders' && (
            <Section title="Order History">
              <div className="p-6">
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div
                        key={order.id}
                        className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-neutral-50 border-b border-neutral-200">
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                            <div>
                              <span className="text-sm text-neutral-500">Order #</span>
                              <span className="ml-2 font-medium">{order.orderNumber || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-sm text-neutral-500">Date</span>
                              <span className="ml-2 font-medium">
                                {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-neutral-500">Status</span>
                              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-neutral-100 text-neutral-800'
                              }`}>
                                {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 md:mt-0 flex items-center">
                            <span className="text-sm text-neutral-500 mr-2">Total</span>
                            <span className="font-semibold text-lg">{formatCurrency(order.total || 0)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-4"
                              onClick={() => router.push(`/admin/orders/${order.id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium mb-2">Items</h4>
                          <div className="space-y-2">
                            {(order.items || []).map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <div className="flex items-center">
                                  {item.imageUrl && (
                                    <div className="w-10 h-10 mr-3 bg-neutral-100 rounded overflow-hidden">
                                      <img
                                        src={item.imageUrl}
                                        alt={item.productName || 'Product'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // Handle image load errors
                                          e.currentTarget.src = '/placeholder-image.jpg';
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium">{item.productName || 'Unknown Product'}</p>
                                    <p className="text-sm text-neutral-500">
                                      {formatCurrency(item.price || 0)} × {item.quantity || 1}
                                    </p>
                                  </div>
                                </div>
                                <div className="font-medium">
                                  {formatCurrency(item.subtotal || (item.price * item.quantity) || 0)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">No Orders Found</h3>
                    <p className="text-neutral-500">
                      {orders.length === 0 ?
                        "This customer hasn't placed any orders yet." :
                        "There was an issue loading the customer's orders."}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      icon={<RefreshCw size={16} />}
                      iconPosition="left"
                      onClick={() => {
                        // Retry loading orders
                        setOrders([]);
                        const fetchOrders = async () => {
                          try {
                            let token = '';
                            if (firebaseUser) {
                              try {
                                token = await firebaseUser.getIdToken(true);
                              } catch (e) {
                                console.error('Error getting token for retry:', e);
                              }
                            }

                            const response = await fetch(`/api/admin/customers/${id}/orders`, {
                              headers: {
                                'Authorization': token ? `Bearer ${token}` : '',
                                'Content-Type': 'application/json'
                              }
                            });

                            if (response.ok) {
                              const data = await response.json();
                              setOrders(data.orders || []);
                              showToast('Orders refreshed successfully', 'success');
                            } else {
                              showToast('Failed to refresh orders', 'error');
                            }
                          } catch (error) {
                            console.error('Error retrying order fetch:', error);
                            showToast('Failed to refresh orders', 'error');
                          }
                        };
                        fetchOrders();
                      }}
                    >
                      Retry Loading Orders
                    </Button>
                  </div>
                )}
              </div>
            </Section>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <Section title="Purchase History">
                <div className="p-6">
                  <PurchaseHistoryChart orders={orders} />
                </div>
              </Section>

              <Section title="Customer Lifetime Value">
                <div className="p-6">
                  <CustomerLifetimeValueChart
                    customer={customer}
                    orders={orders}
                  />
                </div>
              </Section>
            </div>
          )}
        </motion.div>
      </Container>
    </PermissionGuard>
  );
}

// Export the wrapper component with withAdminPage HOC
export default withAdminPage(ParamsWrapper);