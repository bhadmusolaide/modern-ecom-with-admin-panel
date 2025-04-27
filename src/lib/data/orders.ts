import { faker } from '@faker-js/faker';

// Order status types
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Address interface
export interface Address {
  name: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// Order item interface
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantName?: string;
}

// Order note interface
export interface OrderNote {
  id: string;
  date: string;
  text: string;
  author: string;
}

// Order interface
export interface Order {
  id: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentId?: string;
  isPaid: boolean;
  shippingAddress: Address;
  billingAddress?: Address;
  notes: OrderNote[];
  shippingMethod?: string;
  trackingNumber?: string;
}

// Generate a random address
const generateAddress = (): Address => {
  return {
    name: faker.person.fullName(),
    street: faker.location.streetAddress(),
    street2: faker.helpers.maybe(() => faker.location.secondaryAddress(), { probability: 0.3 }),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    postalCode: faker.location.zipCode(),
    country: 'United States',
    phone: faker.helpers.maybe(() => faker.phone.number(), { probability: 0.7 }),
  };
};

// Generate random order items
const generateOrderItems = (count: number): OrderItem[] => {
  return Array.from({ length: count }, () => {
    const price = parseFloat(faker.commerce.price({ min: 10, max: 200 }));
    const quantity = faker.number.int({ min: 1, max: 5 });
    
    return {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      price,
      quantity,
      image: faker.helpers.maybe(() => faker.image.url(), { probability: 0.8 }),
      variantName: faker.helpers.maybe(() => faker.commerce.productMaterial(), { probability: 0.6 }),
    };
  });
};

// Generate orders with random data
const generateMockOrders = (count: number): Order[] => {
  return Array.from({ length: count }, (_, index) => {
    const items = generateOrderItems(faker.number.int({ min: 1, max: 6 }));
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = parseFloat(faker.commerce.price({ min: 5, max: 20 }));
    const tax = Math.round(subtotal * 0.0825 * 100) / 100; // 8.25% tax rate
    const discount = faker.helpers.maybe(
      () => Math.round(subtotal * faker.number.float({ min: 0.05, max: 0.2 }) * 100) / 100,
      { probability: 0.3 }
    ) || 0;
    
    const total = subtotal + shippingCost + tax - discount;
    const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const status = faker.helpers.arrayElement(statuses);
    
    const isPaid = status !== 'pending' || faker.helpers.maybe(() => true, { probability: 0.2 });
    
    const orderDate = faker.date.recent({ days: 30 }).toISOString();
    
    const notes: OrderNote[] = faker.helpers.maybe(
      () => Array.from(
        { length: faker.number.int({ min: 0, max: 3 }) },
        () => ({
          id: faker.string.uuid(),
          date: faker.date.between({ from: orderDate, to: new Date() }).toISOString(),
          text: faker.lorem.paragraph(),
          author: faker.helpers.arrayElement(['System', 'Admin', 'Customer Service']),
        })
      ),
      { probability: 0.7 }
    ) || [];
    
    const shippingAddress = generateAddress();
    const hasBillingAddress = faker.helpers.maybe(() => true, { probability: 0.3 });
    
    return {
      id: `ORD-${(10000 + index).toString()}`,
      date: orderDate,
      customerName: faker.person.fullName(),
      customerEmail: faker.internet.email(),
      customerPhone: faker.helpers.maybe(() => faker.phone.number(), { probability: 0.7 }),
      status,
      items,
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      paymentMethod: faker.helpers.arrayElement(['Credit Card', 'PayPal', 'Apple Pay', 'Google Pay']),
      paymentId: isPaid ? faker.finance.accountNumber(8) : undefined,
      isPaid,
      shippingAddress,
      billingAddress: hasBillingAddress ? generateAddress() : undefined,
      notes,
      shippingMethod: faker.helpers.arrayElement(['Standard', 'Express', '2-Day', 'Next Day']),
      trackingNumber: status === 'shipped' || status === 'delivered' 
        ? faker.number.int({ min: 10000000, max: 99999999 }).toString() 
        : undefined,
    };
  });
};

// Create mock orders
const mockOrders: Order[] = generateMockOrders(25);

// Function to get all orders
export const getAllOrders = (): Order[] => {
  return mockOrders;
};

// Function to get order by ID
export const getOrderById = (id: string): Order | undefined => {
  return mockOrders.find(order => order.id === id);
};

// Function to update order status
export const updateOrderStatus = (orderId: string, status: OrderStatus): Order => {
  const order = mockOrders.find(order => order.id === orderId);
  
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  order.status = status;
  
  // If order is cancelled, mark it as not paid if it wasn't already paid
  if (status === 'cancelled' && !order.isPaid) {
    order.isPaid = false;
  }
  
  // If order is delivered, mark it as paid
  if (status === 'delivered') {
    order.isPaid = true;
  }
  
  return order;
};

// Function to add a tracking number to an order
export const addTrackingNumber = (orderId: string, trackingNumber: string): Order => {
  const order = mockOrders.find(order => order.id === orderId);
  
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  order.trackingNumber = trackingNumber;
  
  return order;
};

// Function to add a note to an order
export const addOrderNote = (orderId: string, text: string, author: string = 'Admin'): Order => {
  const order = mockOrders.find(order => order.id === orderId);
  
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  const newNote: OrderNote = {
    id: faker.string.uuid(),
    date: new Date().toISOString(),
    text,
    author,
  };
  
  order.notes = [...order.notes, newNote];
  
  return order;
};

// Function to get recent orders for dashboard
export const getRecentOrders = (limit: number = 5): Order[] => {
  return [...mockOrders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
};

// Function to get order metrics
export const getOrderMetrics = () => {
  const totalOrders = mockOrders.length;
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0);
  
  const pendingOrders = mockOrders.filter(order => order.status === 'pending').length;
  const processingOrders = mockOrders.filter(order => order.status === 'processing').length;
  const shippedOrders = mockOrders.filter(order => order.status === 'shipped').length;
  const deliveredOrders = mockOrders.filter(order => order.status === 'delivered').length;
  
  return {
    totalOrders,
    totalRevenue,
    pendingOrders,
    processingOrders, 
    shippedOrders,
    deliveredOrders,
  };
}; 