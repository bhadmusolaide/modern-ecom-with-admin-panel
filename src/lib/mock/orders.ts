import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../types';

// Generate a random date within the last 30 days
const getRandomDate = (daysAgo = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
};

// Generate mock orders for development
export const mockOrders: Order[] = [
  {
    id: 'order_1',
    orderNumber: 'YOURS-10001',
    userId: 'user_1',
    customerName: 'John Doe',
    email: 'john.doe@example.com',
    status: OrderStatus.DELIVERED,
    items: [
      {
        id: 'item_1',
        productId: 'prod_1',
        name: 'Classic White T-Shirt',
        price: 2999,
        quantity: 2,
        subtotal: 5998,
        image: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      },
      {
        id: 'item_2',
        productId: 'prod_2',
        name: 'Black Denim Jeans',
        price: 5999,
        quantity: 1,
        subtotal: 5999,
        image: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      }
    ],
    subtotal: 11997,
    tax: 1200,
    shippingCost: 499,
    discount: 0,
    total: 13696,
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      phone: '555-123-4567'
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      phone: '555-123-4567'
    },
    shippingMethod: {
      id: 'shipping_1',
      name: 'Standard Shipping',
      price: 499
    },
    payment: {
      method: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.PAID,
      transactionId: 'txn_1234567890'
    },
    notes: [
      {
        id: 'note_1',
        message: 'Order delivered on time',
        createdAt: getRandomDate(5),
        createdBy: 'admin',
        isCustomerVisible: true
      }
    ],
    trackingInfo: {
      carrier: 'UPS',
      trackingNumber: '1Z999AA10123456784',
      trackingUrl: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
      estimatedDeliveryDate: getRandomDate(-5) // Delivered 5 days ago
    },
    createdAt: getRandomDate(15),
    updatedAt: getRandomDate(5)
  },
  {
    id: 'order_2',
    orderNumber: 'YOURS-10002',
    userId: 'user_2',
    customerName: 'Jane Smith',
    email: 'jane.smith@example.com',
    status: OrderStatus.PROCESSING,
    items: [
      {
        id: 'item_3',
        productId: 'prod_3',
        name: 'Summer Floral Dress',
        price: 4999,
        quantity: 1,
        subtotal: 4999,
        image: 'https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      }
    ],
    subtotal: 4999,
    tax: 500,
    shippingCost: 499,
    discount: 1000,
    total: 4998,
    shippingAddress: {
      firstName: 'Jane',
      lastName: 'Smith',
      address: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'USA',
      phone: '555-987-6543'
    },
    billingAddress: {
      firstName: 'Jane',
      lastName: 'Smith',
      address: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'USA',
      phone: '555-987-6543'
    },
    shippingMethod: {
      id: 'shipping_2',
      name: 'Express Shipping',
      price: 999
    },
    payment: {
      method: PaymentMethod.PAYPAL,
      status: PaymentStatus.PAID,
      transactionId: 'txn_0987654321'
    },
    notes: [],
    createdAt: getRandomDate(3),
    updatedAt: getRandomDate(1)
  },
  {
    id: 'order_3',
    orderNumber: 'YOURS-10003',
    userId: 'user_3',
    customerName: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    status: OrderStatus.PENDING,
    items: [
      {
        id: 'item_4',
        productId: 'prod_4',
        name: 'Leather Jacket',
        price: 12999,
        quantity: 1,
        subtotal: 12999,
        image: 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      },
      {
        id: 'item_5',
        productId: 'prod_5',
        name: 'Wool Scarf',
        price: 1999,
        quantity: 1,
        subtotal: 1999,
        image: 'https://images.pexels.com/photos/45055/pexels-photo-45055.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      }
    ],
    subtotal: 14998,
    tax: 1500,
    shippingCost: 0, // Free shipping
    discount: 0,
    total: 16498,
    shippingAddress: {
      firstName: 'Robert',
      lastName: 'Johnson',
      address: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60007',
      country: 'USA',
      phone: '555-456-7890'
    },
    billingAddress: {
      firstName: 'Robert',
      lastName: 'Johnson',
      address: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60007',
      country: 'USA',
      phone: '555-456-7890'
    },
    shippingMethod: {
      id: 'shipping_3',
      name: 'Free Shipping',
      price: 0
    },
    payment: {
      method: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.PENDING,
      transactionId: ''
    },
    notes: [],
    createdAt: getRandomDate(1),
    updatedAt: getRandomDate(0)
  },
  {
    id: 'order_4',
    orderNumber: 'YOURS-10004',
    userId: 'user_1',
    customerName: 'John Doe',
    email: 'john.doe@example.com',
    status: OrderStatus.SHIPPED,
    items: [
      {
        id: 'item_6',
        productId: 'prod_6',
        name: 'Running Shoes',
        price: 8999,
        quantity: 1,
        subtotal: 8999,
        image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      }
    ],
    subtotal: 8999,
    tax: 900,
    shippingCost: 499,
    discount: 0,
    total: 10398,
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      phone: '555-123-4567'
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
      phone: '555-123-4567'
    },
    shippingMethod: {
      id: 'shipping_1',
      name: 'Standard Shipping',
      price: 499
    },
    payment: {
      method: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.PAID,
      transactionId: 'txn_1122334455'
    },
    notes: [
      {
        id: 'note_2',
        message: 'Package shipped with priority',
        createdAt: getRandomDate(2),
        createdBy: 'admin',
        isCustomerVisible: true
      }
    ],
    trackingInfo: {
      carrier: 'FedEx',
      trackingNumber: '9876543210',
      trackingUrl: 'https://www.fedex.com/apps/fedextrack/?tracknumbers=9876543210',
      estimatedDeliveryDate: getRandomDate(-1) // Estimated delivery tomorrow
    },
    createdAt: getRandomDate(7),
    updatedAt: getRandomDate(2)
  },
  {
    id: 'order_5',
    orderNumber: 'YOURS-10005',
    userId: 'user_4',
    customerName: 'Emily Davis',
    email: 'emily.davis@example.com',
    status: OrderStatus.CANCELLED,
    items: [
      {
        id: 'item_7',
        productId: 'prod_7',
        name: 'Designer Sunglasses',
        price: 15999,
        quantity: 1,
        subtotal: 15999,
        image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      }
    ],
    subtotal: 15999,
    tax: 1600,
    shippingCost: 999,
    discount: 0,
    total: 18598,
    shippingAddress: {
      firstName: 'Emily',
      lastName: 'Davis',
      address: '321 Elm St',
      city: 'Miami',
      state: 'FL',
      postalCode: '33101',
      country: 'USA',
      phone: '555-789-0123'
    },
    billingAddress: {
      firstName: 'Emily',
      lastName: 'Davis',
      address: '321 Elm St',
      city: 'Miami',
      state: 'FL',
      postalCode: '33101',
      country: 'USA',
      phone: '555-789-0123'
    },
    shippingMethod: {
      id: 'shipping_2',
      name: 'Express Shipping',
      price: 999
    },
    payment: {
      method: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.REFUNDED,
      transactionId: 'txn_5566778899'
    },
    notes: [
      {
        id: 'note_3',
        message: 'Customer requested cancellation',
        createdAt: getRandomDate(10),
        createdBy: 'admin',
        isCustomerVisible: false
      },
      {
        id: 'note_4',
        message: 'Refund processed',
        createdAt: getRandomDate(9),
        createdBy: 'admin',
        isCustomerVisible: true
      }
    ],
    createdAt: getRandomDate(12),
    updatedAt: getRandomDate(9)
  },
  {
    id: 'order_6',
    orderNumber: 'YOURS-10006',
    userId: 'user_5',
    customerName: 'Michael Wilson',
    email: 'michael.wilson@example.com',
    status: OrderStatus.REFUNDED,
    items: [
      {
        id: 'item_8',
        productId: 'prod_8',
        name: 'Wireless Headphones',
        price: 19999,
        quantity: 1,
        subtotal: 19999,
        image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      }
    ],
    subtotal: 19999,
    tax: 2000,
    shippingCost: 499,
    discount: 0,
    total: 22498,
    shippingAddress: {
      firstName: 'Michael',
      lastName: 'Wilson',
      address: '654 Maple Ave',
      city: 'Seattle',
      state: 'WA',
      postalCode: '98101',
      country: 'USA',
      phone: '555-321-6547'
    },
    billingAddress: {
      firstName: 'Michael',
      lastName: 'Wilson',
      address: '654 Maple Ave',
      city: 'Seattle',
      state: 'WA',
      postalCode: '98101',
      country: 'USA',
      phone: '555-321-6547'
    },
    shippingMethod: {
      id: 'shipping_1',
      name: 'Standard Shipping',
      price: 499
    },
    payment: {
      method: PaymentMethod.PAYPAL,
      status: PaymentStatus.REFUNDED,
      transactionId: 'txn_6677889900'
    },
    notes: [
      {
        id: 'note_5',
        message: 'Product arrived damaged',
        createdAt: getRandomDate(20),
        createdBy: 'customer',
        isCustomerVisible: true
      },
      {
        id: 'note_6',
        message: 'Full refund approved',
        createdAt: getRandomDate(18),
        createdBy: 'admin',
        isCustomerVisible: true
      }
    ],
    createdAt: getRandomDate(25),
    updatedAt: getRandomDate(18)
  },
  {
    id: 'order_7',
    orderNumber: 'YOURS-10007',
    userId: 'user_6',
    customerName: 'Sarah Brown',
    email: 'sarah.brown@example.com',
    status: OrderStatus.DELIVERED,
    items: [
      {
        id: 'item_9',
        productId: 'prod_9',
        name: 'Cotton Sweater',
        price: 4999,
        quantity: 1,
        subtotal: 4999,
        image: 'https://images.pexels.com/photos/45982/pexels-photo-45982.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      },
      {
        id: 'item_10',
        productId: 'prod_10',
        name: 'Winter Beanie',
        price: 1499,
        quantity: 2,
        subtotal: 2998,
        image: 'https://images.pexels.com/photos/3979134/pexels-photo-3979134.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      }
    ],
    subtotal: 7997,
    tax: 800,
    shippingCost: 499,
    discount: 1000,
    total: 8296,
    shippingAddress: {
      firstName: 'Sarah',
      lastName: 'Brown',
      address: '987 Cedar Ln',
      city: 'Boston',
      state: 'MA',
      postalCode: '02108',
      country: 'USA',
      phone: '555-654-3210'
    },
    billingAddress: {
      firstName: 'Sarah',
      lastName: 'Brown',
      address: '987 Cedar Ln',
      city: 'Boston',
      state: 'MA',
      postalCode: '02108',
      country: 'USA',
      phone: '555-654-3210'
    },
    shippingMethod: {
      id: 'shipping_1',
      name: 'Standard Shipping',
      price: 499
    },
    payment: {
      method: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.PAID,
      transactionId: 'txn_1122334455'
    },
    notes: [
      {
        id: 'note_7',
        message: 'Customer requested gift wrapping',
        createdAt: getRandomDate(30),
        createdBy: 'customer',
        isCustomerVisible: true
      }
    ],
    trackingInfo: {
      carrier: 'USPS',
      trackingNumber: 'US1234567890',
      trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=US1234567890',
      estimatedDeliveryDate: getRandomDate(-10) // Delivered 10 days ago
    },
    createdAt: getRandomDate(30),
    updatedAt: getRandomDate(10)
  }
];

// Function to get mock orders with optional filtering
export const getMockOrders = (filters: any = {}) => {
  let filteredOrders = [...mockOrders];

  // Apply status filter
  if (filters.status) {
    filteredOrders = filteredOrders.filter(order => order.status === filters.status);
  }

  // Apply date filters
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filteredOrders = filteredOrders.filter(order => new Date(order.createdAt) >= fromDate);
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    filteredOrders = filteredOrders.filter(order => new Date(order.createdAt) <= toDate);
  }

  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredOrders = filteredOrders.filter(order =>
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower) ||
      order.email.toLowerCase().includes(searchLower)
    );
  }

  return filteredOrders;
};

// Function to get a mock order by ID
export const getMockOrderById = (id: string) => {
  return mockOrders.find(order => order.id === id) || null;
};