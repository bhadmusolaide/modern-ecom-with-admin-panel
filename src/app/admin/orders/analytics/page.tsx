'use client';

// Force dynamic rendering and disable static optimization
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { Order, OrderStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/format';
import { withAdminPage } from '@/lib/auth/withAdminPage';
import PermissionGuard from '@/components/admin/PermissionGuard';

// Status color mapping
const statusColors = {
  [OrderStatus.PENDING]: 'bg-yellow-500',
  [OrderStatus.PROCESSING]: 'bg-blue-500',
  [OrderStatus.SHIPPED]: 'bg-indigo-500',
  [OrderStatus.DELIVERED]: 'bg-green-500',
  [OrderStatus.CANCELLED]: 'bg-red-500',
  [OrderStatus.REFUNDED]: 'bg-purple-500',
};

function OrderAnalyticsPage() {
  const { user, isAdmin } = useFirebaseAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('year'); // 'year', 'month', 'week'

  // Summary metrics
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);

  // State for chart data
  const [revenueData, setRevenueData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [percentChange, setPercentChange] = useState({
    orders: 0,
    revenue: 0,
    aov: 0,
    conversion: 0
  });

  // Fetch data and calculate metrics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get date ranges based on selected time range
        const now = new Date();
        const currentPeriodStart = new Date();
        const previousPeriodStart = new Date();
        const previousPeriodEnd = new Date();

        // Set date ranges based on time range
        switch (timeRange) {
          case 'week':
            // Current week
            currentPeriodStart.setDate(now.getDate() - 7);
            // Previous week
            previousPeriodStart.setDate(now.getDate() - 14);
            previousPeriodEnd.setDate(now.getDate() - 7);
            break;
          case 'month':
            // Current month
            currentPeriodStart.setDate(now.getDate() - 30);
            // Previous month
            previousPeriodStart.setDate(now.getDate() - 60);
            previousPeriodEnd.setDate(now.getDate() - 30);
            break;
          case 'year':
          default:
            // Current year
            currentPeriodStart.setFullYear(now.getFullYear(), 0, 1);
            // Previous year
            previousPeriodStart.setFullYear(now.getFullYear() - 1, 0, 1);
            previousPeriodEnd.setFullYear(now.getFullYear() - 1, 11, 31);
            break;
        }

        // Fetch orders for current period
        const ordersRef = collection(db, 'orders');
        const currentOrdersQuery = query(
          ordersRef,
          where('createdAt', '>=', currentPeriodStart),
          where('createdAt', '<=', now)
        );

        // Fetch orders for previous period (for comparison)
        const previousOrdersQuery = query(
          ordersRef,
          where('createdAt', '>=', previousPeriodStart),
          where('createdAt', '<=', previousPeriodEnd)
        );

        // Execute queries
        const [currentOrdersSnapshot, previousOrdersSnapshot] = await Promise.all([
          getDocs(currentOrdersQuery),
          getDocs(previousOrdersQuery)
        ]);

        // Process current period orders
        const currentOrders = currentOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const previousOrders = previousOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Calculate total revenue and orders for current period
        const revenue = currentOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const orders = currentOrders.length;
        const averageOrderValue = orders > 0 ? Math.round(revenue / orders) : 0;

        // Calculate metrics for previous period
        const prevRevenue = previousOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const prevOrders = previousOrders.length;
        const prevAOV = prevOrders > 0 ? Math.round(prevRevenue / prevOrders) : 0;

        // Calculate percent changes
        const calculatePercentChange = (current, previous) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return ((current - previous) / previous) * 100;
        };

        setPercentChange({
          orders: calculatePercentChange(orders, prevOrders),
          revenue: calculatePercentChange(revenue, prevRevenue),
          aov: calculatePercentChange(averageOrderValue, prevAOV),
          conversion: 1.2 // Placeholder - would need actual site visit data to calculate
        });

        // Set summary metrics
        setTotalRevenue(revenue);
        setTotalOrders(orders);
        setAverageOrderValue(averageOrderValue);
        setConversionRate(2.8); // Placeholder - would need actual site visit data

        // Prepare revenue data based on time range
        let revenueChartData = [];
        if (timeRange === 'year') {
          // Group by month for yearly view
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          revenueChartData = months.map(month => ({ month, revenue: 0 }));

          currentOrders.forEach(order => {
            if (!order.createdAt) return;
            const date = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            const monthIndex = date.getMonth();
            revenueChartData[monthIndex].revenue += order.total || 0;
          });
        } else if (timeRange === 'month') {
          // Group by week for monthly view
          const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
          revenueChartData = weeks.map(week => ({ month: week, revenue: 0 }));

          currentOrders.forEach(order => {
            if (!order.createdAt) return;
            const date = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            // Calculate which week of the month (1-indexed)
            const weekOfMonth = Math.ceil(date.getDate() / 7);

            if (weekOfMonth >= 1 && weekOfMonth <= 5) {
              revenueChartData[weekOfMonth - 1].revenue += order.total || 0;
            }
          });
        } else {
          // Group by day for weekly view
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          revenueChartData = days.map(day => ({ month: day, revenue: 0 }));

          currentOrders.forEach(order => {
            if (!order.createdAt) return;
            const date = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // Adjust to make Monday index 0

            revenueChartData[dayIndex].revenue += order.total || 0;
          });
        }

        setRevenueData(revenueChartData);

        // Calculate order status distribution
        const statusCounts = Object.values(OrderStatus).reduce((acc, status) => {
          acc[status] = 0;
          return acc;
        }, {});

        currentOrders.forEach(order => {
          if (order.status && statusCounts[order.status] !== undefined) {
            statusCounts[order.status]++;
          }
        });

        const orderStatusChartData = Object.entries(statusCounts)
          .map(([status, count]) => ({ status, count }))
          .filter(item => item.count > 0);

        setOrderStatusData(orderStatusChartData);

        // Calculate top products
        const productMap = {};

        currentOrders.forEach(order => {
          if (!order.items) return;

          order.items.forEach(item => {
            if (!productMap[item.productId]) {
              productMap[item.productId] = {
                id: item.productId,
                name: item.name,
                sales: 0,
                revenue: 0
              };
            }

            productMap[item.productId].sales += item.quantity || 1;
            productMap[item.productId].revenue += item.subtotal || (item.price * item.quantity) || 0;
          });
        });

        const topProductsData = Object.values(productMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setTopProducts(topProductsData);

        // Fetch customer data
        const usersRef = collection(db, 'users');

        // Prepare customer acquisition data
        let customerChartData = [];

        if (timeRange === 'year') {
          // Group by month for yearly view
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          customerChartData = months.map(month => ({
            month,
            newCustomers: 0,
            returningCustomers: 0
          }));

          // This would require more complex queries to get accurate returning vs. new customer data
          // For now, we'll use a simplified approach based on order data

          const customerOrderMap = {};

          // First pass to identify returning customers
          currentOrders.forEach(order => {
            if (!order.userId || !order.createdAt) return;

            if (!customerOrderMap[order.userId]) {
              customerOrderMap[order.userId] = {
                firstOrderDate: order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt),
                orderDates: [order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt)]
              };
            } else {
              customerOrderMap[order.userId].orderDates.push(
                order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt)
              );

              // Update first order date if this one is earlier
              const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
              if (orderDate < customerOrderMap[order.userId].firstOrderDate) {
                customerOrderMap[order.userId].firstOrderDate = orderDate;
              }
            }
          });

          // Second pass to count new vs returning by month
          Object.values(customerOrderMap).forEach(customer => {
            customer.orderDates.forEach(date => {
              const monthIndex = date.getMonth();

              // Check if this is the customer's first order
              if (date.getTime() === customer.firstOrderDate.getTime()) {
                customerChartData[monthIndex].newCustomers++;
              } else {
                customerChartData[monthIndex].returningCustomers++;
              }
            });
          });
        } else {
          // For shorter time ranges, use actual data from users collection
          try {
            const usersRef = collection(db, 'users');

            if (timeRange === 'month') {
              // Group by week for monthly view
              const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
              customerChartData = weeks.map(week => ({
                month: week,
                newCustomers: 0,
                returningCustomers: 0
              }));

              // Get users created in the last month
              const monthAgo = new Date();
              monthAgo.setDate(monthAgo.getDate() - 30);

              const newUsersQuery = query(
                usersRef,
                where('createdAt', '>=', monthAgo)
              );

              const newUsersSnapshot = await getDocs(newUsersQuery);

              // Process users by week
              newUsersSnapshot.docs.forEach(doc => {
                const userData = doc.data();
                if (userData.createdAt) {
                  const createdAt = userData.createdAt.toDate ?
                    userData.createdAt.toDate() : new Date(userData.createdAt);

                  // Calculate which week of the month (1-indexed)
                  const dayOfMonth = createdAt.getDate();
                  const weekOfMonth = Math.ceil(dayOfMonth / 7);

                  if (weekOfMonth >= 1 && weekOfMonth <= 5) {
                    customerChartData[weekOfMonth - 1].newCustomers++;
                  }
                }
              });

              // Get returning customers from orders
              const ordersRef = collection(db, 'orders');
              const monthAgoOrders = new Date();
              monthAgoOrders.setDate(monthAgoOrders.getDate() - 30);

              const ordersQuery = query(
                ordersRef,
                where('createdAt', '>=', monthAgoOrders)
              );

              const ordersSnapshot = await getDocs(ordersQuery);

              // Track unique customers by week
              const customersByWeek = new Map<number, Set<string>>();
              for (let i = 1; i <= 5; i++) {
                customersByWeek.set(i, new Set<string>());
              }

              // Process orders
              ordersSnapshot.docs.forEach(doc => {
                const orderData = doc.data();
                if (orderData.createdAt && orderData.userId) {
                  const createdAt = orderData.createdAt.toDate ?
                    orderData.createdAt.toDate() : new Date(orderData.createdAt);

                  // Calculate which week of the month (1-indexed)
                  const dayOfMonth = createdAt.getDate();
                  const weekOfMonth = Math.ceil(dayOfMonth / 7);

                  if (weekOfMonth >= 1 && weekOfMonth <= 5) {
                    customersByWeek.get(weekOfMonth)?.add(orderData.userId);
                  }
                }
              });

              // Update returning customers count
              customersByWeek.forEach((customers, week) => {
                if (week >= 1 && week <= 5) {
                  customerChartData[week - 1].returningCustomers = customers.size;
                }
              });
            } else {
              // Group by day for weekly view
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              customerChartData = days.map(day => ({
                month: day,
                newCustomers: 0,
                returningCustomers: 0
              }));

              // Get users created in the last week
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);

              const newUsersQuery = query(
                usersRef,
                where('createdAt', '>=', weekAgo)
              );

              const newUsersSnapshot = await getDocs(newUsersQuery);

              // Process users by day of week
              newUsersSnapshot.docs.forEach(doc => {
                const userData = doc.data();
                if (userData.createdAt) {
                  const createdAt = userData.createdAt.toDate ?
                    userData.createdAt.toDate() : new Date(userData.createdAt);

                  // Get day of week (0 = Sunday, 6 = Saturday)
                  const dayOfWeek = createdAt.getDay();
                  // Convert to our array index (0 = Monday, 6 = Sunday)
                  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

                  if (dayIndex >= 0 && dayIndex < 7) {
                    customerChartData[dayIndex].newCustomers++;
                  }
                }
              });

              // Get returning customers from orders
              const ordersRef = collection(db, 'orders');
              const weekAgoOrders = new Date();
              weekAgoOrders.setDate(weekAgoOrders.getDate() - 7);

              const ordersQuery = query(
                ordersRef,
                where('createdAt', '>=', weekAgoOrders)
              );

              const ordersSnapshot = await getDocs(ordersQuery);

              // Track unique customers by day
              const customersByDay = new Map<number, Set<string>>();
              for (let i = 0; i < 7; i++) {
                customersByDay.set(i, new Set<string>());
              }

              // Process orders
              ordersSnapshot.docs.forEach(doc => {
                const orderData = doc.data();
                if (orderData.createdAt && orderData.userId) {
                  const createdAt = orderData.createdAt.toDate ?
                    orderData.createdAt.toDate() : new Date(orderData.createdAt);

                  // Get day of week (0 = Sunday, 6 = Saturday)
                  const dayOfWeek = createdAt.getDay();
                  // Convert to our array index (0 = Monday, 6 = Sunday)
                  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

                  if (dayIndex >= 0 && dayIndex < 7) {
                    customersByDay.get(dayIndex)?.add(orderData.userId);
                  }
                }
              });

              // Update returning customers count
              customersByDay.forEach((customers, day) => {
                if (day >= 0 && day < 7) {
                  customerChartData[day].returningCustomers = customers.size;
                }
              });
            }
          } catch (error) {
            console.error('Error fetching customer data for shorter time ranges:', error);

            // Fallback to empty data if there's an error
            if (timeRange === 'month') {
              const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
              customerChartData = weeks.map(week => ({
                month: week,
                newCustomers: 0,
                returningCustomers: 0
              }));
            } else {
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              customerChartData = days.map(day => ({
                month: day,
                newCustomers: 0,
                returningCustomers: 0
              }));
            }
          }
        }

        setCustomerData(customerChartData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching order analytics data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);



  return (
    <PermissionGuard permissions={['orders:view', 'orders:analytics']}>
      <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <div className="flex items-center mb-1">
            <Link href="/admin/orders" className="text-neutral-600 hover:text-neutral-900 mr-2">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">Order Analytics</h1>
          </div>
          <p className="text-neutral-600">Track sales performance and customer behavior</p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                timeRange === 'week'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100'
              } border border-neutral-200`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 text-sm font-medium ${
                timeRange === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100'
              } border-t border-b border-neutral-200`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('year')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                timeRange === 'year'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100'
              } border border-neutral-200`}
            >
              Year
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-neutral-600">Total Orders</div>
            <div className="p-2 bg-blue-100 rounded-md">
              <ShoppingBag size={20} className="text-blue-600" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-24 bg-neutral-200 rounded animate-pulse"></div>
          ) : (
            <div className="text-2xl font-bold text-neutral-900">{totalOrders}</div>
          )}
          <div className="mt-2 text-sm text-green-600 flex items-center">
            <TrendingUp size={16} className="mr-1" />
            <span>12.5% from last {timeRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-neutral-600">Total Revenue</div>
            <div className="p-2 bg-green-100 rounded-md">
              <DollarSign size={20} className="text-green-600" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-32 bg-neutral-200 rounded animate-pulse"></div>
          ) : (
            <div className="text-2xl font-bold text-neutral-900">{formatCurrency(totalRevenue)}</div>
          )}
          <div className="mt-2 text-sm text-green-600 flex items-center">
            <TrendingUp size={16} className="mr-1" />
            <span>8.2% from last {timeRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-neutral-600">Average Order Value</div>
            <div className="p-2 bg-purple-100 rounded-md">
              <ShoppingBag size={20} className="text-purple-600" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-28 bg-neutral-200 rounded animate-pulse"></div>
          ) : (
            <div className="text-2xl font-bold text-neutral-900">{formatCurrency(averageOrderValue)}</div>
          )}
          <div className="mt-2 text-sm text-green-600 flex items-center">
            <TrendingUp size={16} className="mr-1" />
            <span>3.7% from last {timeRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-neutral-600">Conversion Rate</div>
            <div className="p-2 bg-orange-100 rounded-md">
              <Users size={20} className="text-orange-600" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-neutral-200 rounded animate-pulse"></div>
          ) : (
            <div className="text-2xl font-bold text-neutral-900">{conversionRate}%</div>
          )}
          <div className="mt-2 text-sm text-green-600 flex items-center">
            <TrendingUp size={16} className="mr-1" />
            <span>1.2% from last {timeRange}</span>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Revenue Over Time</h2>
        {loading ? (
          <div className="h-64 w-full bg-neutral-100 rounded animate-pulse flex items-center justify-center">
            <span className="text-neutral-400">Loading chart...</span>
          </div>
        ) : (
          <div className="h-64">
            <div className="flex h-full items-end">
              {revenueData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full mx-1 bg-primary-500 hover:bg-primary-600 transition-all rounded-t"
                    style={{
                      height: `${item.revenue > 0 ? Math.max((item.revenue / Math.max(...revenueData.map(d => d.revenue))) * 100, 5) : 0}%`,
                      maxWidth: '40px',
                      margin: '0 auto'
                    }}
                  ></div>
                  <div className="text-xs text-neutral-600 mt-2">{item.month}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Order Status Distribution</h2>
          {loading ? (
            <div className="h-64 w-full bg-neutral-100 rounded animate-pulse flex items-center justify-center">
              <span className="text-neutral-400">Loading chart...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="relative w-48 h-48">
                {/* Simple pie chart visualization */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {orderStatusData.reduce((acc, item, index, arr) => {
                    const total = arr.reduce((sum, i) => sum + i.count, 0);
                    if (total === 0) return acc; // Avoid division by zero

                    const startAngle = acc.angle;
                    const sliceAngle = (item.count / total) * 360;
                    const endAngle = startAngle + sliceAngle;

                    // Convert angles to radians for calculations
                    const startRad = (startAngle - 90) * (Math.PI / 180);
                    const endRad = (endAngle - 90) * (Math.PI / 180);

                    // Calculate path
                    const x1 = 50 + 50 * Math.cos(startRad);
                    const y1 = 50 + 50 * Math.sin(startRad);
                    const x2 = 50 + 50 * Math.cos(endRad);
                    const y2 = 50 + 50 * Math.sin(endRad);

                    // Determine if the slice is more than 180 degrees
                    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

                    // Create path
                    const path = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    acc.paths.push(
                      <path
                        key={index}
                        d={path}
                        fill={statusColors[item.status]}
                        stroke="#fff"
                        strokeWidth="1"
                      />
                    );

                    acc.angle = endAngle;
                    return acc;
                  }, { angle: 0, paths: [] }).paths}
                </svg>
              </div>

              <div className="ml-8">
                {orderStatusData.map((item, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full ${statusColors[item.status]} mr-2`}></div>
                    <div className="text-sm text-neutral-700">
                      {item.status.charAt(0) + item.status.slice(1).toLowerCase()} ({item.count})
                    </div>
                  </div>
                ))}
                {orderStatusData.length === 0 && (
                  <div className="text-sm text-neutral-500">No order status data available</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Top Selling Products</h2>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="animate-pulse flex items-center">
                  <div className="h-10 w-10 bg-neutral-200 rounded mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-neutral-200 rounded mb-2"></div>
                    <div className="h-3 w-1/2 bg-neutral-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Sales
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {topProducts.length > 0 ? (
                    topProducts.map((product, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                          {product.sales} units
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                          {formatCurrency(product.revenue)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-sm text-neutral-500">
                        No product data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Customer Acquisition */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Customer Acquisition</h2>
        {loading ? (
          <div className="h-64 w-full bg-neutral-100 rounded animate-pulse flex items-center justify-center">
            <span className="text-neutral-400">Loading chart...</span>
          </div>
        ) : (
          <div className="h-64">
            <div className="flex h-full items-end">
              {customerData.length > 0 ? (
                customerData.map((item, index) => {
                  // Find max values for scaling
                  const maxNew = Math.max(...customerData.map(d => d.newCustomers));
                  const maxReturning = Math.max(...customerData.map(d => d.returningCustomers));

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex justify-center">
                        <div
                          className="w-4 bg-blue-500 rounded-t mr-1"
                          style={{
                            height: `${item.newCustomers > 0 ? Math.max((item.newCustomers / maxNew) * 100, 5) : 0}%`,
                            maxWidth: '16px'
                          }}
                        ></div>
                        <div
                          className="w-4 bg-green-500 rounded-t ml-1"
                          style={{
                            height: `${item.returningCustomers > 0 ? Math.max((item.returningCustomers / maxReturning) * 100, 5) : 0}%`,
                            maxWidth: '16px'
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-neutral-600 mt-2">{item.month}</div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex justify-center items-center h-full">
                  <p className="text-neutral-500">No customer data available</p>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex justify-center mt-4">
          <div className="flex items-center mr-6">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-neutral-600">New Customers</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-neutral-600">Returning Customers</span>
          </div>
        </div>
      </div>
    </div>
    </PermissionGuard>
  );
}

export default withAdminPage(OrderAnalyticsPage);
