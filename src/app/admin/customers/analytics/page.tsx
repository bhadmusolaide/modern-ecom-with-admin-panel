'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Calendar,
  RefreshCw,
  Filter,
  ChevronDown
} from 'lucide-react';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { useToast } from '@/lib/context/ToastContext';
import { getCustomerAnalytics } from '@/lib/firebase/customers';
import { withAdminPage } from '@/lib/auth/withAdminPage';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/admin/PageHeader';
import Container from '@/components/admin/layouts/Container';
import Section from '@/components/admin/layouts/Section';
import Grid from '@/components/admin/layouts/Grid';
import Card from '@/components/admin/layouts/Card';
import { formatCurrency } from '@/lib/utils/format';
import PermissionGuard from '@/components/admin/PermissionGuard';
import CustomerAcquisitionChart from '@/components/admin/customers/CustomerAcquisitionChart';
import CustomerSegmentDistributionChart from '@/components/admin/customers/CustomerSegmentDistributionChart';
import CustomerSpendingChart from '@/components/admin/customers/CustomerSpendingChart';
import CustomerRetentionChart from '@/components/admin/customers/CustomerRetentionChart';

function CustomerAnalyticsPage() {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // State
  const [analytics, setAnalytics] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    newCustomers: 0,
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    averageCustomerValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await getCustomerAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching customer analytics:', error);
        showToast('Failed to load customer analytics', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [showToast]);

  // Handle time range change
  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(e.target.value);
  };

  // Refresh data
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const data = await getCustomerAnalytics();
      setAnalytics(data);
      showToast('Analytics refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing customer analytics:', error);
      showToast('Failed to refresh analytics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PermissionGuard permissions={['customers:view']}>
      <Container>
        <PageHeader
          title="Customer Analytics"
          description="Analyze customer behavior and performance metrics"
          showBreadcrumbs={true}
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Customers', href: '/admin/customers' },
            { label: 'Analytics', href: '/admin/customers/analytics' }
          ]}
          actions={[
            {
              label: 'Refresh',
              icon: <RefreshCw size={16} />,
              onClick: handleRefresh,
              variant: 'outline',
              disabled: isLoading
            }
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
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
          </div>

          {showFilters && (
            <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Time Range
                  </label>
                  <select
                    className="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={timeRange}
                    onChange={handleTimeRangeChange}
                  >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="year">Last Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <Section title="Key Metrics" className="mb-6">
            <Grid cols={2} mdCols={4} gap="md" className="p-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-500">Total Customers</h3>
                  <div className="p-2 bg-blue-100 rounded-md">
                    <Users size={16} className="text-blue-600" />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {isLoading ? '...' : analytics.totalCustomers}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {isLoading ? '...' : `${analytics.newCustomers} new in last 30 days`}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-500">Active Customers</h3>
                  <div className="p-2 bg-green-100 rounded-md">
                    <UserCheck size={16} className="text-green-600" />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {isLoading ? '...' : analytics.activeCustomers}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {isLoading ? '...' : `${Math.round((analytics.activeCustomers / analytics.totalCustomers) * 100)}% of total`}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-500">Average Order Value</h3>
                  <div className="p-2 bg-purple-100 rounded-md">
                    <ShoppingBag size={16} className="text-purple-600" />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {isLoading ? '...' : formatCurrency(analytics.averageOrderValue)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {isLoading ? '...' : `${analytics.totalOrders} total orders`}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-500">Customer Lifetime Value</h3>
                  <div className="p-2 bg-yellow-100 rounded-md">
                    <DollarSign size={16} className="text-yellow-600" />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {isLoading ? '...' : formatCurrency(analytics.averageCustomerValue)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {isLoading ? '...' : `${formatCurrency(analytics.totalRevenue)} total revenue`}
                    </p>
                  </div>
                </div>
              </Card>
            </Grid>
          </Section>

          {/* Charts */}
          <Grid cols={1} mdCols={2} gap="md" className="mb-6">
            <Section title="Customer Acquisition">
              <div className="p-6 h-80">
                <CustomerAcquisitionChart timeRange={timeRange} />
              </div>
            </Section>

            <Section title="Customer Segment Distribution">
              <div className="p-6 h-80">
                <CustomerSegmentDistributionChart />
              </div>
            </Section>
          </Grid>

          <Grid cols={1} mdCols={2} gap="md">
            <Section title="Customer Spending">
              <div className="p-6 h-80">
                <CustomerSpendingChart timeRange={timeRange} />
              </div>
            </Section>

            <Section title="Customer Retention">
              <div className="p-6 h-80">
                <CustomerRetentionChart timeRange={timeRange} />
              </div>
            </Section>
          </Grid>
        </motion.div>
      </Container>
    </PermissionGuard>
  );
}

export default withAdminPage(CustomerAnalyticsPage);
