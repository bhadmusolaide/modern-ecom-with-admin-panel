'use client';

// Force dynamic rendering and disable static optimization
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Settings, ArrowUpRight, BarChart as BarChartIcon, Package, ShoppingBag, Globe, PieChart as PieChartIcon, Users, LineChart as LineChartIcon, Sliders, Clock } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useSiteSettings } from '@/lib/context/SiteSettingsContext';
import { useFirebaseAuth } from '@/lib/firebase/auth/FirebaseAuthProvider';
import { DashboardProvider, useDashboard, TimeRange } from '@/lib/context/DashboardContext';
import { ActivityProvider, useActivity, getActivityDescription } from '@/lib/context/ActivityContext';
import PageHeader from '@/components/admin/PageHeader';
import Container from '@/components/admin/layouts/Container';
import Grid from '@/components/admin/layouts/Grid';
import Card from '@/components/admin/layouts/Card';
import Section from '@/components/admin/layouts/Section';
import { BarChart, PieChart, LineChart } from '@/components/admin/charts';
import DashboardSettings from '@/components/admin/DashboardSettings';
import TimeRangeSelector from '@/components/admin/TimeRangeSelector';
import ActivityFeed from '@/components/admin/ActivityFeed';
import { withAdminPage } from '@/lib/auth/withAdminPage';

import { formatCurrency } from '@/lib/utils/format';

// Data inspection utility to debug what's actually in Firestore
const inspectFirestoreData = async (db: any) => {
  try {

    const { collection, getDocs } = await import('firebase/firestore');

    // Check orders collection
    const ordersRef = collection(db, 'orders');
    const ordersSnapshot = await getDocs(ordersRef);

    // Check products collection
    const productsRef = collection(db, 'products');
    const productsSnapshot = await getDocs(productsRef);

    // Check users collection
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    return {
      orders: ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      products: productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      users: usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
  } catch (error) {
    console.error('âŒ Error inspecting Firestore data:', error);
    return { orders: [], products: [], users: [] };
  }
};

// Sample data seeding function
const seedSampleData = async (db: any) => {
  try {

    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

    // Sample orders data
    const sampleOrders = [
      {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        total: 89.99,
        status: 'COMPLETED',
        items: [
          { name: 'Organic Cotton T-Shirt', price: 29.99, quantity: 2 },
          { name: 'Denim Jeans', price: 59.99, quantity: 1 }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        total: 145.50,
        status: 'PENDING',
        items: [
          { name: 'Summer Dress', price: 45.50, quantity: 1 },
          { name: 'Sandals', price: 55.00, quantity: 2 }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        customerName: 'Mike Johnson',
        customerEmail: 'mike@example.com',
        total: 234.75,
        status: 'DELIVERED',
        items: [
          { name: 'Leather Jacket', price: 129.99, quantity: 1 },
          { name: 'Boots', price: 104.76, quantity: 1 }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    // Seed orders
    for (const order of sampleOrders) {
      await addDoc(collection(db, 'orders'), order);
    }

    // Sample products data
    const sampleProducts = [
      {
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable and sustainable t-shirt made from organic cotton',
        price: 29.99,
        category: 'tops',
        stock: 50,
        lowStockThreshold: 10,
        imageUrl: 'https://images.pexels.com/photos/5384423/pexels-photo-5384423.jpeg',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        name: 'Denim Jeans',
        description: 'Classic fit denim jeans made from recycled materials',
        price: 59.99,
        category: 'bottoms',
        stock: 25,
        lowStockThreshold: 5,
        imageUrl: 'https://images.pexels.com/photos/52518/jeans-pants-blue-shop-52518.jpeg',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        name: 'Summer Dress',
        description: 'Light and airy summer dress perfect for warm weather',
        price: 45.50,
        category: 'one-pieces',
        stock: 0,
        lowStockThreshold: 5,
        imageUrl: 'https://images.pexels.com/photos/5868743/pexels-photo-5868743.jpeg',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    // Seed products
    for (const product of sampleProducts) {
      await addDoc(collection(db, 'products'), product);
    }

    // Sample users data
    const sampleUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'customer',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'customer',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      }
    ];

    // Seed users
    for (const user of sampleUsers) {
      await addDoc(collection(db, 'users'), user);
    }

    return true;
  } catch (error) {
    console.error('âŒ Error seeding sample data:', error);
    return false;
  }
};

// Main component that wraps the dashboard content with the providers
function AdminDashboard() {
  return (
    <ActivityProvider>
      <DashboardProvider>
        <DashboardContent />
      </DashboardProvider>
    </ActivityProvider>
  );
}

// Export with admin page protection
export default withAdminPage(AdminDashboard);

// Wrapper component to use context
const DashboardContent = () => {
  const { settings, isLoading: settingsLoading } = useSiteSettings();
  const { user } = useFirebaseAuth();
  const { widgets, globalTimeRange, setGlobalTimeRange, updateWidgetTimeRange } = useDashboard();
  const { activities, addActivity } = useActivity();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    revenue: 0
  });
  const [productStats, setProductStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0
  });

  // State for chart data
  const [salesData, setSalesData] = useState<{ label: string; value: number }[]>([]);
  const [previousSalesData, setPreviousSalesData] = useState<{ label: string; value: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ label: string; value: number }[]>([]);
  const [customerData, setCustomerData] = useState<{ label: string; value: number }[]>([]);
  const [previousRevenue, setPreviousRevenue] = useState(0);

// Get widget configurations
  const getWidgetConfig = (id: string) => {
    return widgets.find(w => w.id === id);
  };

  // Function to fetch data based on time range
  const fetchDataForTimeRange = async (timeRange: TimeRange) => {
    try {

      // Check if Firebase is properly initialized
      if (!db) {
        console.error('âŒ Firebase db is not initialized');
        throw new Error('Firebase database not initialized');
      }
      // Get date ranges based on selected time range
      const now = new Date();
      const currentPeriodStart = new Date();
      const previousPeriodStart = new Date();
      const previousPeriodEnd = new Date();

      // Set date ranges based on time range
      switch (timeRange) {
        case 'day':
          currentPeriodStart.setHours(0, 0, 0, 0);
          previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
          previousPeriodStart.setHours(0, 0, 0, 0);
          previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
          previousPeriodEnd.setHours(23, 59, 59, 999);
          break;
        case 'week':
          // Start of current week (Sunday)
          currentPeriodStart.setDate(now.getDate() - now.getDay());
          currentPeriodStart.setHours(0, 0, 0, 0);
          // Previous week
          previousPeriodStart.setDate(currentPeriodStart.getDate() - 7);
          previousPeriodEnd.setDate(currentPeriodStart.getDate() - 1);
          previousPeriodEnd.setHours(23, 59, 59, 999);
          break;
        case 'month':
          // Start of current month
          currentPeriodStart.setDate(1);
          currentPeriodStart.setHours(0, 0, 0, 0);
          // Previous month
          previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
          previousPeriodStart.setDate(1);
          previousPeriodStart.setHours(0, 0, 0, 0);
          previousPeriodEnd.setDate(0); // Last day of previous month
          previousPeriodEnd.setHours(23, 59, 59, 999);
          break;
        case 'year':
          // Start of current year
          currentPeriodStart.setMonth(0, 1);
          currentPeriodStart.setHours(0, 0, 0, 0);
          // Previous year
          previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
          previousPeriodStart.setMonth(0, 1);
          previousPeriodStart.setHours(0, 0, 0, 0);
          previousPeriodEnd.setFullYear(previousPeriodEnd.getFullYear() - 1);
          previousPeriodEnd.setMonth(11, 31);
          previousPeriodEnd.setHours(23, 59, 59, 999);
          break;
      }

      // Fetch orders data
      if (!db) {
        console.error('âŒ Firebase db is not available');
        return;
      }
      const ordersRef = collection(db, 'orders');

      // Fetch recent orders and filter by period in JS to handle mixed Timestamp/string/Date
      const recentOrdersSnapshot = await getDocs(query(ordersRef, orderBy('createdAt', 'desc'), limit(1000)));
      const allOrders = recentOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      const parseDate = (v: any): Date | null => {
        if (!v) return null;
        if (typeof v?.toDate === 'function') {
          const d = v.toDate();
          return isNaN(d.getTime()) ? null : d;
        }
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      };

      const currentOrders = allOrders.filter(o => {
        const d = parseDate(o.createdAt);
        return d && d >= currentPeriodStart && d <= now;
      });

      const previousOrders = allOrders.filter(o => {
        const d = parseDate(o.createdAt);
        return d && d >= previousPeriodStart && d <= previousPeriodEnd;
      });

      // Fetch products data
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // Calculate order stats - using actual status values from database
      const pendingOrders = currentOrders.filter(order =>
        ['pending', 'awaiting_stock'].includes(order.status)
      ).length;
      const completedOrders = currentOrders.filter(order =>
        ['shipped', 'delivered'].includes(order.status)
      ).length;

      const totalRevenue = currentOrders.reduce((sum, order) => sum + (order.total || 0), 0);


       // Compute previous period revenue
       const prevRevenue = previousOrders.reduce((sum, order) => sum + (order.total || 0), 0);
       setPreviousRevenue(prevRevenue);

      // Calculate product stats
      const lowStockProducts = products.filter(product =>
        (product.stock > 0 && product.stock <= product.lowStockThreshold) ||
        (product.stock > 0 && product.stock <= 5) // Default threshold if not set
      ).length;

      const outOfStockProducts = products.filter(product =>
        product.stock === 0 || product.stock === undefined
      ).length;

      // Prepare sales data based on time range
      let currentSalesData = [];
      let previousSalesData = [];

      switch (timeRange) {
        case 'day':
          // Group by hour
          currentSalesData = groupOrdersByHour(currentOrders);
          previousSalesData = groupOrdersByHour(previousOrders);
          break;
        case 'week':
          // Group by day of week
          currentSalesData = groupOrdersByDayOfWeek(currentOrders);
          previousSalesData = groupOrdersByDayOfWeek(previousOrders);
          break;
        case 'month':
          // Group by week
          currentSalesData = groupOrdersByWeek(currentOrders);
          previousSalesData = groupOrdersByWeek(previousOrders);
          break;
        case 'year':
          // Group by month
          currentSalesData = groupOrdersByMonth(currentOrders);
          previousSalesData = groupOrdersByMonth(previousOrders);
          break;
      }

      // Update state with the fetched data
      setSalesData(currentSalesData.length > 0 ? currentSalesData : [
        { label: 'No Data', value: 0 }
      ]);
      setPreviousSalesData(previousSalesData.length > 0 ? previousSalesData : [
        { label: 'No Data', value: 0 }
      ]);
      setOrderStats({
        total: currentOrders.length,
        pending: pendingOrders,
        completed: completedOrders,
        revenue: totalRevenue
      });
      setProductStats({
        total: products.length,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts
      });

      // Set category data with fallback
      if (products.length > 0) {
        // Process categories from products
        const categoryGroups = products.reduce((acc, product) => {
          const category = product.category || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = 0;
          }
          acc[category]++;
          return acc;
        }, {});

        const categoryChartData = Object.entries(categoryGroups)
          .map(([label, count]) => ({ label, value: count as number }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 4);

        setCategoryData(categoryChartData.length > 0 ? categoryChartData : [
          { label: 'No Categories', value: 0 }
        ]);
      } else {
        setCategoryData([
          { label: 'No Products', value: 0 }
        ]);
      }
    } catch (error) {
      console.error('âŒ Error fetching dashboard data:', error);
      console.error('ðŸ” Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timeRange,
        dbAvailable: !!db
      });
      // Set default empty data in case of error
      setSalesData([]);
      setPreviousSalesData([]);
      setOrderStats({ total: 0, pending: 0, completed: 0, revenue: 0 });
      setProductStats({ total: 0, lowStock: 0, outOfStock: 0 });
    }
  };

  // Helper functions for grouping orders
  const groupOrdersByHour = (orders) => {
    const hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'];
    const hourlyData = hours.map(hour => ({ label: hour, value: 0 }));

    orders.forEach(order => {
      if (!order.createdAt) return;

      const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const hour = orderDate.getHours();

      // Map 24h format to 12h format for display
      let hourIndex;
      if (hour >= 9 && hour <= 12) {
        hourIndex = hour - 9; // 9am to 12pm
      } else if (hour >= 13 && hour <= 17) {
        hourIndex = hour - 9; // 1pm to 5pm (13 - 9 = 4 = 1pm)
      } else {
        return; // Outside business hours
      }

      if (hourIndex >= 0 && hourIndex < hourlyData.length) {
        hourlyData[hourIndex].value += order.total || 0;
      }
    });

    return hourlyData;
  };

  const groupOrdersByDayOfWeek = (orders) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = days.map(day => ({ label: day, value: 0 }));

    orders.forEach(order => {
      if (!order.createdAt) return;

      const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const dayIndex = orderDate.getDay(); // 0 = Sunday, 6 = Saturday

      dailyData[dayIndex].value += order.total || 0;
    });

    return dailyData;
  };

  const groupOrdersByWeek = (orders) => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
    const weeklyData = weeks.map(week => ({ label: week, value: 0 }));

    orders.forEach(order => {
      if (!order.createdAt) return;

      const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      // Calculate which week of the month (1-indexed)
      const weekOfMonth = Math.ceil(orderDate.getDate() / 7);

      if (weekOfMonth >= 1 && weekOfMonth <= 5) {
        weeklyData[weekOfMonth - 1].value += order.total || 0;
      }
    });

    // Filter out weeks with no data
    return weeklyData.filter(week => week.label);
  };

  const groupOrdersByMonth = (orders) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(month => ({ label: month, value: 0 }));

    orders.forEach(order => {
      if (!order.createdAt) return;

      const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const monthIndex = orderDate.getMonth(); // 0 = January, 11 = December

      monthlyData[monthIndex].value += order.total || 0;
    });

    return monthlyData;
  };

  // Set page as loaded and fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch data based on the global time range
        await fetchDataForTimeRange(globalTimeRange);

        // Fetch category data from products collection
        if (!db) {
          console.error('âŒ Firebase db is not available for category data');
          return;
        }
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        // Group products by category
        const categoryGroups = products.reduce((acc, product) => {
          const category = product.category || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = 0;
          }
          acc[category]++;
          return acc;
        }, {});

        // Convert to chart data format
         const categoryChartData = Object.entries(categoryGroups)
           .map(([label, count]) => ({ label, value: count as number }))
           .sort((a, b) => b.value - a.value)
           .slice(0, 4); // Top 4 categories

         setCategoryData(categoryChartData.length > 0 ? categoryChartData : [
           { label: 'No Categories', value: 0 }
         ]);

        // Fetch customer data
        const usersRef = collection(db, 'users');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newUsersQuery = query(
          usersRef,
          where('createdAt', '>=', thirtyDaysAgo)
        );

        const [allUsersSnapshot, newUsersSnapshot] = await Promise.all([
          getDocs(usersRef),
          getDocs(newUsersQuery)
        ]);

        const totalUsers = allUsersSnapshot.size;
        const newUsers = newUsersSnapshot.size;
        const returningUsers = totalUsers - newUsers;

        setCustomerData([
          { label: 'New', value: newUsers > 0 ? Math.round((newUsers / totalUsers) * 100) : 0 },
          { label: 'Returning', value: returningUsers > 0 ? Math.round((returningUsers / totalUsers) * 100) : 0 }
        ]);

        // First, inspect what's actually in the collections
        if (!db) {
          console.error('âŒ Firebase db not available for inspection');
        } else {
          const existingData = await inspectFirestoreData(db);

          // If no data exists, seed sample data
          if (existingData.orders.length === 0 && existingData.products.length === 0) {

            await seedSampleData(db);
          }
        }

        // Fetch real activities if none exist in context
        if (activities.length === 0) {
          const activitiesRef = collection(db, 'activities');
          const activitiesQuery = query(
            activitiesRef,
            orderBy('timestamp', 'desc'),
            limit(7)
          );

          const activitiesSnapshot = await getDocs(activitiesQuery);

          if (!activitiesSnapshot.empty) {
            // Add activities with slight delay between them for visual effect
            activitiesSnapshot.docs.forEach((doc, index) => {
              const activityData = doc.data();
              setTimeout(() => {
                addActivity({
                  type: activityData.type,
                  action: activityData.action,
                  description: activityData.description,
                  targetId: activityData.targetId,
                  targetName: activityData.targetName
                });
              }, index * 100);
            });
          }
        }

        setIsPageLoaded(true);
      } catch (error) {
        console.error('Error fetching initial dashboard data:', error);
        setIsPageLoaded(true); // Set page as loaded even on error
      }
    };

    fetchInitialData();

    return () => {
      // Cleanup if needed
    };
  }, [activities.length, addActivity, globalTimeRange]);

  // Update data when global time range changes
  useEffect(() => {
    if (isPageLoaded) {
      const updateData = async () => {
        await fetchDataForTimeRange(globalTimeRange);
      };
      updateData();
    }
  }, [globalTimeRange, isPageLoaded, fetchDataForTimeRange]);

// Normalize Firestore Timestamp | ISO string | Date to Date
	  const normalizeDate = (val: any): Date | null => {
	    if (!val) return null;
	    if (typeof val?.toDate === 'function') return val.toDate();
	    if (typeof val === 'string') {
	      const d = new Date(val);
	      return isNaN(d.getTime()) ? null : d;
	    }
	    if (val instanceof Date) return val;
	    return null;
	  };

	  // Realtime subscriptions for current period data (orders/products/users)
	  useEffect(() => {
	    if (!isPageLoaded) return;

	    const now = new Date();
	    const currentStart = new Date();
	    const prevStart = new Date();
	    const prevEnd = new Date();

	    // Compute period boundaries based on globalTimeRange
	    switch (globalTimeRange) {
	      case 'day':
	        currentStart.setHours(0, 0, 0, 0);
	        prevStart.setDate(now.getDate() - 1); prevStart.setHours(0, 0, 0, 0);
	        prevEnd.setDate(now.getDate() - 1); prevEnd.setHours(23, 59, 59, 999);
	        break;
	      case 'week':
	        currentStart.setDate(now.getDate() - now.getDay()); currentStart.setHours(0, 0, 0, 0);
	        prevStart.setDate(currentStart.getDate() - 7);
	        prevEnd.setDate(currentStart.getDate() - 1); prevEnd.setHours(23, 59, 59, 999);
	        break;
	      case 'month':
	        currentStart.setDate(1); currentStart.setHours(0, 0, 0, 0);
	        prevStart.setMonth(prevStart.getMonth() - 1); prevStart.setDate(1); prevStart.setHours(0, 0, 0, 0);
	        prevEnd.setDate(0); prevEnd.setHours(23, 59, 59, 999);
	        break;
	      case 'year':
	        currentStart.setMonth(0, 1); currentStart.setHours(0, 0, 0, 0);
	        prevStart.setFullYear(prevStart.getFullYear() - 1); prevStart.setMonth(0, 1); prevStart.setHours(0, 0, 0, 0);
	        prevEnd.setFullYear(prevEnd.getFullYear() - 1); prevEnd.setMonth(11, 31); prevEnd.setHours(23, 59, 59, 999);
	        break;
	    }

	    const unsubs: Array<() => void> = [];

	    // Orders: stream recent and filter by current period to handle mixed createdAt types
	    if (!db) {
	      console.error('âŒ Firebase db is not available for real-time orders');
	      return () => {};
	    }
	    const ordersRef = collection(db, 'orders');
	    const ordersQueryRealtime = query(ordersRef, orderBy('createdAt', 'desc'), limit(1000));
	    const unsubOrders = onSnapshot(ordersQueryRealtime, (snapshot) => {

	      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
	      const currentOrders = allOrders.filter(o => {
	        const d = normalizeDate(o.createdAt);
	        return d && d >= currentStart && d <= now;
	      });

	      const pendingOrders = currentOrders.filter(o => ['pending', 'awaiting_stock'].includes(o.status)).length;
	      const completedOrders = currentOrders.filter(o => ['shipped', 'delivered'].includes(o.status)).length;
	      const currentTotalRevenue = currentOrders.reduce((sum, o) => sum + (o.total || 0), 0);


	      // Update the state with real-time data
	      setOrderStats({
	        total: currentOrders.length,
	        pending: pendingOrders,
	        completed: completedOrders,
	        revenue: currentTotalRevenue
	      });
	      const totalRevenue = currentOrders.reduce((sum, o) => sum + (o.total || 0), 0);

	      let currentSales: { label: string; value: number }[] = [];
	      switch (globalTimeRange) {
	        case 'day': currentSales = groupOrdersByHour(currentOrders); break;
	        case 'week': currentSales = groupOrdersByDayOfWeek(currentOrders); break;
	        case 'month': currentSales = groupOrdersByWeek(currentOrders); break;
	        case 'year': currentSales = groupOrdersByMonth(currentOrders); break;
	      }

	      setSalesData(currentSales.length > 0 ? currentSales : [{ label: 'No Data', value: 0 }]);
	      setOrderStats({ total: currentOrders.length, pending: pendingOrders, completed: completedOrders, revenue: totalRevenue });

	    });
	    unsubs.push(unsubOrders);

	    // Products realtime (also feeds category chart)
	    const productsRef = collection(db, 'products');
	    const unsubProducts = onSnapshot(productsRef, (snapshot) => {

	      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
	      const lowStockProducts = products.filter(p => (p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5))).length;
	      const outOfStockProducts = products.filter(p => p.stock === 0 || p.stock === undefined).length;
	      setProductStats({ total: products.length, lowStock: lowStockProducts, outOfStock: outOfStockProducts });

	      const categoryGroups = products.reduce((acc: Record<string, number>, product: any) => {
	        const category = product.category || 'Uncategorized';
	        acc[category] = (acc[category] || 0) + 1;
	        return acc;
	      }, {});
	      const categoryChartData = Object.entries(categoryGroups)
	        .map(([label, count]) => ({ label, value: count as number }))
	        .sort((a, b) => b.value - a.value)
	        .slice(0, 4);
	      setCategoryData(categoryChartData.length > 0 ? categoryChartData : [{ label: 'No Categories', value: 0 }]);
	    });
	    unsubs.push(unsubProducts);

	    // Users realtime for customer insights
	    const usersRef = collection(db, 'users');
	    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	    let totalUsersLocal = 0; let newUsersLocal = 0;
	    const recomputeCustomerData = () => {
	      const returningUsers = Math.max(totalUsersLocal - newUsersLocal, 0);
	      setCustomerData([
	        { label: 'New', value: totalUsersLocal > 0 ? Math.round((newUsersLocal / totalUsersLocal) * 100) : 0 },
	        { label: 'Returning', value: totalUsersLocal > 0 ? Math.round((returningUsers / totalUsersLocal) * 100) : 0 }
	      ]);
	    };
	    const unsubUsersAll = onSnapshot(usersRef, (snap) => { totalUsersLocal = snap.size; recomputeCustomerData(); });
	    const unsubUsersNew = onSnapshot(query(usersRef, where('createdAt', '>=', thirtyDaysAgo)), (snap) => { newUsersLocal = snap.size; recomputeCustomerData(); });
	    unsubs.push(unsubUsersAll, unsubUsersNew);

		    // Robust customer insights subscription (fallback for mixed createdAt types)
		    const unsubUsers = onSnapshot(usersRef, (snap) => {
		      const users = snap.docs.map(doc => doc.data() as any);
		      const total = users.length;
		      const newCount = users.filter(u => {
		        const d = normalizeDate(u.createdAt);
		        return d && d >= thirtyDaysAgo;
		      }).length;
		      const returning = Math.max(total - newCount, 0);
		      setCustomerData([
		        { label: 'New', value: total > 0 ? Math.round((newCount / total) * 100) : 0 },
		        { label: 'Returning', value: total > 0 ? Math.round((returning / total) * 100) : 0 }
		      ]);
		    });
		    unsubs.push(unsubUsers);

// Previous period snapshot (one-time via recent docs, filtered in JS)
	    (async () => {
	      try {
	        const prevSnap = await getDocs(query(ordersRef, orderBy('createdAt', 'desc'), limit(1000)));
	        const prevAll = prevSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
	        const prevOrders = prevAll.filter(o => {
	          const d = normalizeDate(o.createdAt);
	          return d && d >= prevStart && d <= prevEnd;
	        });
	        let prevSales: { label: string; value: number }[] = [];
	        switch (globalTimeRange) {
	          case 'day': prevSales = groupOrdersByHour(prevOrders); break;
	          case 'week': prevSales = groupOrdersByDayOfWeek(prevOrders); break;
	          case 'month': prevSales = groupOrdersByWeek(prevOrders); break;
	          case 'year': prevSales = groupOrdersByMonth(prevOrders); break;
	        }
	        setPreviousSalesData(prevSales);
	        const prevRev = prevOrders.reduce((sum, o) => sum + (o.total || 0), 0);
	        setPreviousRevenue(prevRev);
	      } catch (e) {

	      }
	    })();

	    return () => { unsubs.forEach(u => { try { u && u(); } catch { /* ignore */ } }); };
	  }, [globalTimeRange, isPageLoaded]);

	if (settingsLoading || !isPageLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-neutral-200 mb-4"></div>
            <div className="h-4 w-48 bg-neutral-200 rounded mb-3"></div>
            <div className="h-3 w-32 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Define action buttons for the PageHeader
  const headerActions = [
    {
      label: 'Customize Dashboard',
      icon: <Sliders size={16} />,
      onClick: () => setSettingsOpen(true),
      variant: 'primary' as const
    },
    {
      label: 'Site Settings',
      icon: <Settings size={16} />,
      href: '/admin/site-settings',
      variant: 'outline' as const
    },
    {
      label: 'View Store',
      icon: <Globe size={16} />,
      href: '/',
      variant: 'outline' as const
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.name || 'Admin'}. Here's an overview of your store.`}
        actions={headerActions}
        showBreadcrumbs={false}
      />

      {/* Global time range selector */}
      <div className="flex justify-end mb-6">
        <TimeRangeSelector
          value={globalTimeRange}
          onChange={setGlobalTimeRange}
          className="ml-auto"
        />
      </div>

      {/* Key Metrics */}
      {getWidgetConfig('orders')?.visible || getWidgetConfig('products')?.visible || getWidgetConfig('analytics')?.visible ? (
        <Section
          title="Store Performance"
          description="Overview of your store's key metrics"
          spacing="md"
        >
          <Grid cols={1} mdCols={3} gap="md" className="mb-8">
            {getWidgetConfig('orders')?.visible && (
              <Card hover>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Orders</h3>
                  <div className="p-2 bg-blue-100 rounded-md">
                    <Package size={20} className="text-blue-600" />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-neutral-900">{orderStats.total}</p>
                    <p className="text-sm text-neutral-500">Total Orders</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">+{orderStats.pending} pending</p>
                    <p className="text-sm text-neutral-500">{formatCurrency(orderStats.revenue)} revenue</p>
                  </div>
                </div>

	                {orderStats.total === 0 && (
	                  <p className="mt-2 text-sm text-neutral-500">No orders in selected {getWidgetConfig('orders')?.timeRange || globalTimeRange} period.</p>
	                )}

                <Link
                  href="/admin/orders"
                  className="mt-4 inline-flex items-center text-blue-600 hover:underline"
                >
                  View All Orders <ArrowUpRight size={16} className="ml-1" />
                </Link>
              </Card>
            )}

            {getWidgetConfig('products')?.visible && (
              <Card hover>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Products</h3>
                  <div className="p-2 bg-primary-100 rounded-md">
                    <ShoppingBag size={20} className="text-primary-600" />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-neutral-900">{productStats.total}</p>
                    <p className="text-sm text-neutral-500">Total Products</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-amber-600">{productStats.lowStock} low stock</p>
                    <p className="text-sm font-medium text-red-600">{productStats.outOfStock} out of stock</p>
                  </div>
                </div>
                <div className="mt-4 flex space-x-4">
                  <Link
                    href="/admin/products"
                    className="inline-flex items-center text-primary-600 hover:underline"
                  >
                    View Products <ArrowUpRight size={16} className="ml-1" />
                  </Link>
                  <Link
                    href="/admin/products/new"
                    className="inline-flex items-center text-neutral-600 hover:underline"
                  >
                    Add New <ArrowUpRight size={16} className="ml-1" />
                  </Link>
                </div>
              </Card>
            )}

            {getWidgetConfig('analytics')?.visible && (
              <Card hover>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Analytics</h3>
                  <div className="p-2 bg-accent-100 rounded-md">
                    <BarChartIcon size={20} className="text-accent-600" />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-neutral-900">{formatCurrency(orderStats.revenue)}</p>
                    <p className="text-sm text-neutral-500">Total Revenue</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${orderStats.revenue >= previousRevenue ? 'text-green-600' : 'text-red-600'}`}>
                      {(previousRevenue > 0 ? (((orderStats.revenue - previousRevenue) / previousRevenue) * 100).toFixed(1) : '0.0')}% vs previous period
                    </p>
                    <p className="text-sm text-neutral-500">Based on {orderStats.total} orders</p>
                  </div>
                </div>
                <Link
                  href="/admin/orders/analytics"
                  className="mt-4 inline-flex items-center text-accent-600 hover:underline"
                >
                  View Analytics <ArrowUpRight size={16} className="ml-1" />
                </Link>
              </Card>
            )}
          </Grid>
        </Section>
      ) : null}

      {/* Sales Trend */}
      {getWidgetConfig('salesTrend')?.visible && (
        <Section
          title="Sales Trend"
          description={`Sales performance for ${getWidgetConfig('salesTrend')?.timeRange || globalTimeRange}`}
          spacing="md"
          actions={
            <TimeRangeSelector
              value={getWidgetConfig('salesTrend')?.timeRange || globalTimeRange}
              onChange={(value) => updateWidgetTimeRange('salesTrend', value)}
              size="sm"
            />
          }
        >
          <Card className="mb-8">
            <LineChart
              data={salesData}
              comparisonData={previousSalesData}
              height={250}
              title={`${getWidgetConfig('salesTrend')?.timeRange || globalTimeRange === 'day' ? 'Today\'s' :
                getWidgetConfig('salesTrend')?.timeRange || globalTimeRange === 'week' ? 'Weekly' :
                getWidgetConfig('salesTrend')?.timeRange || globalTimeRange === 'month' ? 'Monthly' : 'Yearly'} Sales`}
              subtitle="Current period vs. previous period"
            />
          </Card>
        </Section>
      )}

      {/* Customer Insights */}
      {getWidgetConfig('customerDemographics')?.visible || getWidgetConfig('purchaseBehavior')?.visible ? (
        <Section
          title="Customer Insights"
          description="Information about your customers and their behavior"
          spacing="md"
        >
          <Grid cols={1} mdCols={2} gap="md" className="mb-8">
            {getWidgetConfig('customerDemographics')?.visible && (
              <Card hover>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Customer Demographics</h3>
                  <div className="flex items-center space-x-2">
                    <TimeRangeSelector
                      value={getWidgetConfig('customerDemographics')?.timeRange || globalTimeRange}
                      onChange={(value) => updateWidgetTimeRange('customerDemographics', value)}
                      size="sm"
                    />
                    <div className="p-2 bg-indigo-100 rounded-md">
                      <Users size={20} className="text-indigo-600" />
                    </div>
                  </div>
                </div>
                <div className="h-40 bg-neutral-50 rounded-md mb-4 p-2">
                  <PieChart
                    data={customerData}
                    size={150}
                    title=""
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">Top Location</p>
                    <p className="text-neutral-500">United States (42%)</p>
                  </div>
                  <div>
                    <p className="font-medium">Age Group</p>
                    <p className="text-neutral-500">25-34 (38%)</p>
                  </div>
                  <div>
                    <p className="font-medium">Gender</p>
                    <p className="text-neutral-500">Female (56%)</p>
                  </div>
                </div>
              </Card>
            )}

            {getWidgetConfig('purchaseBehavior')?.visible && (
              <Card hover>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Purchase Behavior</h3>
                  <div className="flex items-center space-x-2">
                    <TimeRangeSelector
                      value={getWidgetConfig('purchaseBehavior')?.timeRange || globalTimeRange}
                      onChange={(value) => updateWidgetTimeRange('purchaseBehavior', value)}
                      size="sm"
                    />
                    <div className="p-2 bg-emerald-100 rounded-md">
                      <PieChartIcon size={20} className="text-emerald-600" />
                    </div>
                  </div>
                </div>
                <div className="h-40 bg-neutral-50 rounded-md mb-4 p-2">
                  <BarChart
                    data={categoryData}
                    height={150}
                    title=""
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">Avg. Order Value</p>
                    <p className="text-neutral-500">$86.24</p>
                  </div>
                  <div>
                    <p className="font-medium">Repeat Purchase</p>
                    <p className="text-neutral-500">28%</p>
                  </div>
                  <div>
                    <p className="font-medium">Cart Abandonment</p>
                    <p className="text-neutral-500">62%</p>
                  </div>
                </div>
              </Card>
            )}
          </Grid>
        </Section>
      ) : null}

      {/* Site Configuration Cards */}
      {getWidgetConfig('siteSettings')?.visible || getWidgetConfig('theme')?.visible || getWidgetConfig('socialMedia')?.visible ? (
        <Section
          title="Site Configuration"
          description="Manage your store's settings and appearance"
          spacing="md"
        >
          <Grid cols={1} mdCols={2} lgCols={3} gap="md" className="mb-8">
            {getWidgetConfig('siteSettings')?.visible && (
              <Card hover>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Site Settings</h3>
                  <div className="p-2 bg-primary-100 rounded-md">
                    <Settings size={20} className="text-primary-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-neutral-600">
                    <span className="font-medium">Site Name:</span> {settings?.siteName || 'Not set'}
                  </p>
                  <p className="text-neutral-600">
                    <span className="font-medium">Tagline:</span> {settings?.siteTagline || 'Not set'}
                  </p>
                </div>
                <Link
                  href="/admin/site-settings"
                  className="mt-4 inline-flex items-center text-primary-600 hover:underline"
                >
                  Manage Settings <ArrowUpRight size={16} className="ml-1" />
                </Link>
              </Card>
            )}

            {getWidgetConfig('theme')?.visible && (
              <Card hover>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Theme</h3>
                  <div className="p-2 bg-secondary-100 rounded-md">
                    <Settings size={20} className="text-secondary-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-neutral-600">Primary Color:</span>
                    <div
                      className="w-6 h-6 rounded-full border border-neutral-300"
                      style={{ backgroundColor: settings?.primaryColor || '#7c3aed' }}
                    ></div>
                    <span className="text-neutral-600">{settings?.primaryColor || '#7c3aed'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-neutral-600">Secondary Color:</span>
                    <div
                      className="w-6 h-6 rounded-full border border-neutral-300"
                      style={{ backgroundColor: settings?.secondaryColor || '#059669' }}
                    ></div>
                    <span className="text-neutral-600">{settings?.secondaryColor || '#059669'}</span>
                  </div>
                </div>
                <Link
                  href="/admin/site-settings/theme"
                  className="mt-4 inline-flex items-center text-secondary-600 hover:underline"
                >
                  Customize Theme <ArrowUpRight size={16} className="ml-1" />
                </Link>
              </Card>
            )}

            {getWidgetConfig('socialMedia')?.visible && (
              <Card hover>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Social Media</h3>
                  <div className="p-2 bg-accent-100 rounded-md">
                    <Settings size={20} className="text-accent-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  {settings?.socialLinks && settings.socialLinks.length > 0 ? (
                    settings.socialLinks.map((social: any, index: number) => (
                      <p key={index} className="text-neutral-600">
                        <span className="font-medium capitalize">{social.platform}:</span> Connected
                      </p>
                    ))
                  ) : (
                    <p className="text-neutral-600">No social media accounts connected</p>
                  )}
                </div>
                <Link
                  href="/admin/site-settings/footer"
                  className="mt-4 inline-flex items-center text-accent-600 hover:underline"
                >
                  Manage Social Media <ArrowUpRight size={16} className="ml-1" />
                </Link>
              </Card>
            )}
          </Grid>
        </Section>
      ) : null}

      {/* Activity Feed */}
      {getWidgetConfig('activityFeed')?.visible && (
        <Section
          title="Recent Activity"
          description="Track admin actions and system events"
          spacing="md"
          actions={
            <Link
              href="/admin/activity"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              View All <ArrowUpRight size={14} className="ml-1" />
            </Link>
          }
        >
          <ActivityFeed
            className="mb-8"
            maxItems={5}
            compact={true}
            showFilters={true}
            title="Recent Activity"
          />
        </Section>
      )}

      {/* Dashboard Settings Modal */}
      <DashboardSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
