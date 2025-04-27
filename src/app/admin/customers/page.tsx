'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  ChevronDown,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Clock,
  DollarSign,
  ShoppingBag,
  Tag
} from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';
import { User as UserType, CustomerSegment } from '@/lib/types';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import {
  getCustomers,
  getCustomerSegments,
  setCustomerActiveStatus,
  resetCustomerPassword
} from '@/lib/api/customerApi'; // Use API client instead of direct Firebase access
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ResponsiveTable, { Column } from '@/components/ui/ResponsiveTable';
import PageHeader from '@/components/admin/PageHeader';
import Container from '@/components/admin/layouts/Container';
import Section from '@/components/admin/layouts/Section';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { withAdminPage } from '@/lib/auth/withAdminPage';

function CustomersPage() {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // State
  const [customers, setCustomers] = useState<UserType[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<UserType[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch customers and segments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch customers with better error handling
        try {
          console.log('Customers page: Fetching customers data');
          const result = await getCustomers();

          if (!result) {
            console.error('Customers page: No result returned from getCustomers()');
            showToast('Failed to load customers: No data returned', 'error');
            return;
          }

          if (!result.customers) {
            console.error('Customers page: No customers property in result');
            showToast('Failed to load customers: Invalid data format', 'error');
            return;
          }

          console.log(`Customers page: Successfully fetched ${result.customers.length} customers`);
          setCustomers(result.customers);
          setFilteredCustomers(result.customers);
        } catch (customersError) {
          console.error('Customers page: Error fetching customers:', customersError);
          showToast(`Failed to load customers: ${customersError instanceof Error ? customersError.message : 'Unknown error'}`, 'error');
          // Continue to fetch segments even if customers fetch fails
        }

        // Fetch segments with better error handling
        try {
          console.log('Customers page: Fetching segments data');
          const fetchedSegments = await getCustomerSegments();
          console.log(`Customers page: Successfully fetched ${fetchedSegments.length} segments`);
          setSegments(fetchedSegments);
        } catch (segmentsError) {
          console.error('Customers page: Error fetching segments:', segmentsError);
          showToast(`Failed to load customer segments: ${segmentsError instanceof Error ? segmentsError.message : 'Unknown error'}`, 'error');
        }
      } catch (error) {
        console.error('Customers page: Unhandled error in fetchData:', error);
        showToast(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  // Apply filters when search term, segment filter, or status filter changes
  useEffect(() => {
    let filtered = [...customers];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        customer =>
          customer.name?.toLowerCase().includes(term) ||
          customer.email.toLowerCase().includes(term) ||
          customer.phone?.toLowerCase().includes(term)
      );
    }

    // Apply segment filter
    if (segmentFilter !== 'all') {
      filtered = filtered.filter(
        customer => customer.segment?.includes(segmentFilter)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(
        customer => customer.isActive === isActive
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, segmentFilter, statusFilter]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle segment filter change
  const handleSegmentFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSegmentFilter(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // Handle customer activation/deactivation
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setIsProcessing(true);

      await setCustomerActiveStatus(id, !currentStatus);

      // Update local state
      setCustomers(prevCustomers =>
        prevCustomers.map(customer =>
          customer.id === id
            ? { ...customer, isActive: !currentStatus }
            : customer
        )
      );

      showToast(
        `Customer ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
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
  const handleResetPassword = async (email: string) => {
    try {
      setIsProcessing(true);

      await resetCustomerPassword(email);

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

  // Define columns for the responsive table
  const columns: Column<UserType>[] = [
    {
      header: 'Customer',
      accessor: 'name',
      cell: (customer) => (
        <div className="flex items-center">
          <div className="w-10 h-10 flex-shrink-0 mr-3 bg-neutral-100 rounded-full flex items-center justify-center">
            {customer.avatar ? (
              <img
                src={customer.avatar}
                alt={customer.name || 'Customer'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-neutral-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-neutral-900">
              {customer.name || 'No Name'}
            </div>
            <div className="text-sm text-neutral-500">{customer.email}</div>
          </div>
        </div>
      ),
      className: 'min-w-[250px]',
      mobileLabel: 'Customer',
      priority: 'high'
    },
    {
      header: 'Contact',
      accessor: 'phone',
      cell: (customer) => (
        <div className="space-y-1">
          {customer.phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-1 text-neutral-400" />
              <span>{customer.phone}</span>
            </div>
          )}
          <div className="flex items-center text-sm">
            <Mail className="h-4 w-4 mr-1 text-neutral-400" />
            <span>{customer.email}</span>
          </div>
        </div>
      ),
      className: 'min-w-[200px]',
      mobileLabel: 'Contact',
      priority: 'medium'
    },
    {
      header: 'Orders',
      accessor: 'totalOrders',
      cell: (customer) => (
        <div className="text-center">
          <div className="text-lg font-semibold">
            {customer.totalOrders || 0}
          </div>
          <div className="text-xs text-neutral-500">orders</div>
        </div>
      ),
      className: 'text-center',
      mobileLabel: 'Orders',
      priority: 'medium'
    },
    {
      header: 'Spent',
      accessor: 'totalSpent',
      cell: (customer) => (
        <div className="text-center">
          <div className="text-lg font-semibold">
            {formatCurrency(customer.totalSpent || 0)}
          </div>
          <div className="text-xs text-neutral-500">lifetime</div>
        </div>
      ),
      className: 'text-center',
      mobileLabel: 'Spent',
      priority: 'medium'
    },
    {
      header: 'Last Order',
      accessor: 'lastOrderDate',
      cell: (customer) => (
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1 text-neutral-400" />
          <span>
            {customer.lastOrderDate
              ? formatDate(customer.lastOrderDate)
              : 'Never'}
          </span>
        </div>
      ),
      className: '',
      mobileLabel: 'Last Order',
      priority: 'low'
    },
    {
      header: 'Segments',
      accessor: 'segment',
      cell: (customer) => (
        <div className="flex flex-wrap gap-1">
          {customer.segment && customer.segment.length > 0 ? (
            customer.segment.map(segmentId => {
              const segment = segments.find(s => s.id === segmentId);
              return (
                <span
                  key={segmentId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {segment?.name || segmentId}
                </span>
              );
            })
          ) : (
            <span className="text-neutral-400 text-sm">No segments</span>
          )}
        </div>
      ),
      className: '',
      mobileLabel: 'Segments',
      priority: 'low'
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (customer) => (
        <div className="flex justify-center">
          {customer.isActive ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <XCircle className="h-3 w-3 mr-1" />
              Inactive
            </span>
          )}
        </div>
      ),
      className: 'text-center',
      mobileLabel: 'Status',
      priority: 'high'
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (customer) => (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => router.push(`/admin/customers/${customer.id}`)}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="View Customer"
          >
            <User className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleToggleStatus(customer.id, customer.isActive || false)}
            className={`p-1 ${customer.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} transition-colors`}
            title={customer.isActive ? 'Deactivate Customer' : 'Activate Customer'}
            disabled={isProcessing}
          >
            {customer.isActive ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => handleResetPassword(customer.email)}
            className="p-1 text-orange-600 hover:text-orange-800 transition-colors"
            title="Reset Password"
            disabled={isProcessing}
          >
            <Mail className="h-5 w-5" />
          </button>
        </div>
      ),
      className: 'text-right',
      mobileLabel: 'Actions',
      priority: 'high'
    }
  ];

  return (
    <PermissionGuard permissions={['customers:view']}>
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Customer Management"
          description="View and manage your store customers"
          showBreadcrumbs={true}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Customers', href: '/admin/customers' }
          ]}
          actions={[
            {
              label: 'Add Customer',
              icon: <UserPlus size={16} />,
              onClick: () => router.push('/admin/customers/new'),
              variant: 'primary'
            },
            {
              label: 'Export',
              icon: <Download size={16} />,
              onClick: () => router.push('/admin/customers/export'),
              variant: 'outline'
            }
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          <Section>
            <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>

                <Button
                  variant={showFilters ? "primary" : "outline"}
                  size="md"
                  icon={<Filter size={16} />}
                  iconPosition="left"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters {showFilters ? <ChevronDown size={16} className="ml-1" /> : null}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="md"
                  icon={<RefreshCw size={16} />}
                  iconPosition="left"
                  onClick={() => router.refresh()}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Segment
                    </label>
                    <select
                      className="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={segmentFilter}
                      onChange={handleSegmentFilterChange}
                    >
                      <option value="all">All Segments</option>
                      {segments.map(segment => (
                        <option key={segment.id} value={segment.id}>
                          {segment.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <ResponsiveTable
              data={filteredCustomers}
              columns={columns}
              keyField="id"
              isLoading={isLoading}
              emptyMessage="No customers found"
              onRowClick={(customer) => router.push(`/admin/customers/${customer.id}`)}
              mobileCardMode={true}
            />
          </Section>
        </motion.div>
      </div>
    </PermissionGuard>
  );
}

export default withAdminPage(CustomersPage);
