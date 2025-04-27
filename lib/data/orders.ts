export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
  sku?: string;
  options?: {
    size?: string;
    color?: string;
    [key: string]: any;
  };
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  paymentMethod: string;
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

// Generate a set of mock orders
export const orders: Order[] = [
  {
    id: 'ORD-1001',
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    date: '2023-09-15T10:30:00',
    status: 'delivered',
    items: [
      {
        productId: 'PRD-001',
        productName: 'Premium T-Shirt',
        price: 29.99,
        quantity: 2,
        subtotal: 59.98,
        imageUrl: 'https://images.pexels.com/photos/5384423/pexels-photo-5384423.jpeg',
        options: {
          size: 'M',
          color: 'Black'
        }
      },
      {
        productId: 'PRD-002',
        productName: 'Denim Jeans',
        price: 59.99,
        quantity: 1,
        subtotal: 59.99,
        imageUrl: 'https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg',
        options: {
          size: '32',
          color: 'Blue'
        }
      }
    ],
    total: 129.97,
    subtotal: 119.97,
    shipping: 10.00,
    tax: 0,
    paymentMethod: 'Credit Card',
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States'
    },
    billingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States'
    },
    trackingNumber: 'TRK9876543210',
    trackingUrl: 'https://example.com/track/TRK9876543210'
  },
  {
    id: 'ORD-1002',
    customerName: 'Jane Smith',
    customerEmail: 'jane.smith@example.com',
    date: '2023-09-18T14:45:00',
    status: 'shipped',
    items: [
      {
        productId: 'PRD-003',
        productName: 'Wool Sweater',
        price: 49.99,
        quantity: 1,
        subtotal: 49.99,
        imageUrl: 'https://images.pexels.com/photos/45982/pexels-photo-45982.jpeg',
        options: {
          size: 'L',
          color: 'Gray'
        }
      }
    ],
    total: 59.99,
    subtotal: 49.99,
    shipping: 10.00,
    tax: 0,
    paymentMethod: 'PayPal',
    shippingAddress: {
      street: '456 Oak Avenue',
      city: 'Boston',
      state: 'MA',
      zip: '02108',
      country: 'United States'
    },
    billingAddress: {
      street: '456 Oak Avenue',
      city: 'Boston',
      state: 'MA',
      zip: '02108',
      country: 'United States'
    },
    trackingNumber: 'TRK1234567890',
    trackingUrl: 'https://example.com/track/TRK1234567890'
  },
  {
    id: 'ORD-1003',
    customerName: 'Robert Johnson',
    customerEmail: 'robert.johnson@example.com',
    date: '2023-09-20T09:15:00',
    status: 'processing',
    items: [
      {
        productId: 'PRD-004',
        productName: 'Leather Jacket',
        price: 199.99,
        quantity: 1,
        subtotal: 199.99,
        imageUrl: 'https://images.pexels.com/photos/16170/pexels-photo.jpg',
        options: {
          size: 'XL',
          color: 'Brown'
        }
      },
      {
        productId: 'PRD-005',
        productName: 'Casual Shirt',
        price: 34.99,
        quantity: 2,
        subtotal: 69.98,
        imageUrl: 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg',
        options: {
          size: 'L',
          color: 'White'
        }
      }
    ],
    total: 279.97,
    subtotal: 269.97,
    shipping: 10.00,
    tax: 0,
    paymentMethod: 'Credit Card',
    shippingAddress: {
      street: '789 Pine Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'United States'
    },
    billingAddress: {
      street: '789 Pine Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'United States'
    }
  },
  {
    id: 'ORD-1004',
    customerName: 'Emily Davis',
    customerEmail: 'emily.davis@example.com',
    date: '2023-09-22T16:30:00',
    status: 'pending',
    items: [
      {
        productId: 'PRD-006',
        productName: 'Summer Dress',
        price: 79.99,
        quantity: 1,
        subtotal: 79.99,
        imageUrl: 'https://images.pexels.com/photos/291762/pexels-photo-291762.jpeg',
        options: {
          size: 'S',
          color: 'Floral'
        }
      }
    ],
    total: 89.99,
    subtotal: 79.99,
    shipping: 10.00,
    tax: 0,
    paymentMethod: 'Credit Card',
    shippingAddress: {
      street: '321 Elm Road',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'United States'
    },
    billingAddress: {
      street: '321 Elm Road',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'United States'
    }
  },
  {
    id: 'ORD-1005',
    customerName: 'Michael Wilson',
    customerEmail: 'michael.wilson@example.com',
    date: '2023-09-23T11:20:00',
    status: 'cancelled',
    items: [
      {
        productId: 'PRD-007',
        productName: 'Running Shoes',
        price: 89.99,
        quantity: 1,
        subtotal: 89.99,
        imageUrl: 'https://images.pexels.com/photos/2385477/pexels-photo-2385477.jpeg',
        options: {
          size: '10',
          color: 'Black/Red'
        }
      }
    ],
    total: 99.99,
    subtotal: 89.99,
    shipping: 10.00,
    tax: 0,
    paymentMethod: 'PayPal',
    shippingAddress: {
      street: '654 Maple Ave',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
      country: 'United States'
    },
    billingAddress: {
      street: '654 Maple Ave',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
      country: 'United States'
    }
  },
  {
    id: 'ORD-1006',
    customerName: 'Jessica Brown',
    customerEmail: 'jessica.brown@example.com',
    date: '2023-09-25T13:40:00',
    status: 'delivered',
    items: [
      {
        productId: 'PRD-008',
        productName: 'Scarf',
        price: 24.99,
        quantity: 1,
        subtotal: 24.99,
        imageUrl: 'https://images.pexels.com/photos/972995/pexels-photo-972995.jpeg',
        options: {
          color: 'Multicolor'
        }
      },
      {
        productId: 'PRD-009',
        productName: 'Winter Hat',
        price: 19.99,
        quantity: 1,
        subtotal: 19.99,
        imageUrl: 'https://images.pexels.com/photos/1451361/pexels-photo-1451361.jpeg',
        options: {
          color: 'Gray'
        }
      }
    ],
    total: 54.98,
    subtotal: 44.98,
    shipping: 10.00,
    tax: 0,
    paymentMethod: 'Credit Card',
    shippingAddress: {
      street: '987 Cedar Lane',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      country: 'United States'
    },
    billingAddress: {
      street: '987 Cedar Lane',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      country: 'United States'
    },
    trackingNumber: 'TRK5678901234',
    trackingUrl: 'https://example.com/track/TRK5678901234'
  },
  {
    id: 'ORD-1007',
    customerName: 'David Miller',
    customerEmail: 'david.miller@example.com',
    date: '2023-09-26T10:15:00',
    status: 'processing',
    items: [
      {
        productId: 'PRD-010',
        productName: 'Backpack',
        price: 59.99,
        quantity: 1,
        subtotal: 59.99,
        imageUrl: 'https://images.pexels.com/photos/1294731/pexels-photo-1294731.jpeg',
        options: {
          color: 'Navy Blue'
        }
      }
    ],
    total: 69.99,
    subtotal: 59.99,
    shipping: 10.00,
    tax: 0,
    paymentMethod: 'Credit Card',
    shippingAddress: {
      street: '753 Birch Street',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
      country: 'United States'
    },
    billingAddress: {
      street: '753 Birch Street',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
      country: 'United States'
    }
  },
  {
    id: 'ORD-1008',
    customerName: 'Sarah Taylor',
    customerEmail: 'sarah.taylor@example.com',
    date: '2023-09-27T15:50:00',
    status: 'shipped',
    items: [
      {
        productId: 'PRD-011',
        productName: 'Sunglasses',
        price: 129.99,
        quantity: 1,
        subtotal: 129.99,
        imageUrl: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg',
        options: {
          color: 'Black'
        }
      }
    ],
    total: 139.99,
    subtotal: 129.99,
    shipping: 10.00,
    tax: 0,
    paymentMethod: 'PayPal',
    shippingAddress: {
      street: '159 Spruce Avenue',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      country: 'United States'
    },
    billingAddress: {
      street: '159 Spruce Avenue',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      country: 'United States'
    },
    trackingNumber: 'TRK2345678901',
    trackingUrl: 'https://example.com/track/TRK2345678901'
  },
  {
    id: 'ORD-1009',
    customerName: 'Thomas Anderson',
    customerEmail: 'thomas.anderson@example.com',
    date: '2023-09-28T09:30:00',
    status: 'pending',
    items: [
      {
        productId: 'PRD-012',
        productName: 'Watch',
        price: 249.99,
        quantity: 1,
        subtotal: 249.99,
        imageUrl: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg',
        options: {
          color: 'Silver'
        }
      }
    ],
    total: 259.99,
    subtotal: 249.99,
    shipping: 10.00,
    tax: 0,
    paymentMethod: 'Credit Card',
    shippingAddress: {
      street: '852 Walnut Drive',
      city: 'Philadelphia',
      state: 'PA',
      zip: '19102',
      country: 'United States'
    },
    billingAddress: {
      street: '852 Walnut Drive',
      city: 'Philadelphia',
      state: 'PA',
      zip: '19102',
      country: 'United States'
    }
  },
  {
    id: 'ORD-1010',
    customerName: 'Lisa Martin',
    customerEmail: 'lisa.martin@example.com',
    date: '2023-09-29T14:20:00',
    status: 'delivered',
    items: [
      {
        productId: 'PRD-013',
        productName: 'Earrings',
        price: 39.99,
        quantity: 1,
        subtotal: 39.99,
        imageUrl: 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg',
        options: {
          color: 'Gold'
        }
      },
      {
        productId: 'PRD-014',
        productName: 'Necklace',
        price: 59.99,
        quantity: 1,
        subtotal: 59.99,
        imageUrl: 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg',
        options: {
          color: 'Gold'
        }
      }
    ],
    total: 109.98,
    subtotal: 99.98,
    shipping: 10.00,
    tax: 0,
    paymentMethod: 'Credit Card',
    shippingAddress: {
      street: '369 Ash Boulevard',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      country: 'United States'
    },
    billingAddress: {
      street: '369 Ash Boulevard',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      country: 'United States'
    },
    trackingNumber: 'TRK3456789012',
    trackingUrl: 'https://example.com/track/TRK3456789012'
  }
];

// Helper function to get orders by status
export const getOrdersByStatus = (status: OrderStatus): Order[] => {
  return orders.filter(order => order.status === status);
};

// Helper function to get order by ID
export const getOrderById = (id: string): Order | undefined => {
  return orders.find(order => order.id === id);
};

// Calculate order statistics
export const orderStats = {
  total: orders.length,
  pending: getOrdersByStatus('pending').length,
  processing: getOrdersByStatus('processing').length,
  shipped: getOrdersByStatus('shipped').length,
  delivered: getOrdersByStatus('delivered').length,
  cancelled: getOrdersByStatus('cancelled').length,
  revenue: orders.reduce((sum, order) => sum + order.total, 0),
}; 