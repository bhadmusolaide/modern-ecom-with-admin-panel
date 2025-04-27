export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];  // Array of all product images

  // Category information
  category: string;  // Category ID (primary category)
  categoryName?: string;
  categoryInfo?: Category;  // Full category object
  categories?: string[];  // Array of category IDs for multiple categories
  categoryNames?: string[];  // Array of category names for display

  description?: string;
  colors?: string[];
  sizes?: string[];
  isNew?: boolean;
  isSale?: boolean;
  isFeatured?: boolean;
  salePrice?: number;
  rating?: number;
  reviewCount?: number;
  tags?: string[];

  // Inventory management
  stock?: number;
  sku?: string;
  barcode?: string;
  trackInventory?: boolean;
  lowStockThreshold?: number;
  inventoryStatus?: InventoryStatus;
  backorderEnabled?: boolean;
  backorderLimit?: number;
  inventoryHistory?: InventoryHistoryEntry[];
  warehouseLocation?: string;
  restockDate?: string;

  // Variants
  hasVariants?: boolean;
  variants?: ProductVariant[];

  // SEO fields
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  slug?: string;

  // Display settings
  displayOrder?: number;
  isActive?: boolean;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  price: number;
  salePrice?: number;
  stock?: number;
  color?: string;
  size?: string;
  image?: string;
  barcode?: string;
  trackInventory?: boolean;
  inventoryStatus?: InventoryStatus;
  lowStockThreshold?: number;
  backorderEnabled?: boolean;
  backorderLimit?: number;
  warehouseLocation?: string;
  restockDate?: string;
  isDefault?: boolean;
  isAvailable?: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  metadata?: Record<string, any>;
}

export interface Category {
  id: string;
  name: string;
  count: number;
  image?: string;
  slug?: string;
  description?: string;
  parentId?: string;
  parentName?: string;
  children?: Category[];
  level?: number;
  isActive?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FilterOption {
  id: string;
  name: string;
  options: {
    value: string;
    label: string;
    count?: number;
  }[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt?: Date;
  lastLoginAt?: Date;
  permissions?: string[];
  isActive?: boolean;
  emailVerified?: boolean;
  avatar?: string;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: Address;
  isActive?: boolean;
  emailVerified?: boolean;
  segment?: string[];
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: Date;
  notes?: string;
  avatar?: string;
  userId?: string; // Reference to auth user if registered
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description?: string;
  criteria?: SegmentCriteria;
  customerCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

export interface SegmentCriteria {
  minSpent?: number;
  maxSpent?: number;
  minOrders?: number;
  maxOrders?: number;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  purchasedProducts?: string[];
  purchasedCategories?: string[];
  tags?: string[];
  customRules?: Record<string, any>;
}

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer'
}

/**
 * Order Status Enum
 * Represents the possible states of an order in the system
 */
export enum OrderStatus {
  PENDING = 'pending',           // Order created but not yet processed
  PROCESSING = 'processing',     // Order is being prepared
  SHIPPED = 'shipped',           // Order has been shipped
  DELIVERED = 'delivered',       // Order has been delivered
  CANCELLED = 'cancelled',       // Order was cancelled
  REFUNDED = 'refunded',         // Order was refunded
  ON_HOLD = 'on_hold',           // Order is on hold (payment issues, etc.)
  BACKORDERED = 'backordered',   // Items are out of stock but will be shipped when available
  PARTIALLY_SHIPPED = 'partially_shipped', // Some items shipped, others still processing or backordered
  AWAITING_STOCK = 'awaiting_stock', // Order is waiting for stock to be available
  READY_FOR_PICKUP = 'ready_for_pickup' // Order is ready for in-store pickup
}

/**
 * Payment Status Enum
 * Represents the possible states of payment for an order
 */
export enum PaymentStatus {
  PENDING = 'pending',           // Payment not yet processed
  COMPLETED = 'completed',       // Payment successfully processed
  FAILED = 'failed',             // Payment processing failed
  REFUNDED = 'refunded',         // Payment was refunded
  PARTIALLY_REFUNDED = 'partially_refunded' // Payment was partially refunded
}

/**
 * Payment Method Enum
 * Represents the available payment methods
 */
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery'
}

/**
 * Payment Provider Enum
 * Represents the payment processing providers
 */
export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  MANUAL = 'manual'
}

/**
 * Inventory Status Enum
 * Represents the possible states of a product's inventory
 */
export enum InventoryStatus {
  IN_STOCK = 'in_stock',           // Product is available
  LOW_STOCK = 'low_stock',         // Product is running low (below threshold)
  OUT_OF_STOCK = 'out_of_stock',   // Product is out of stock
  BACKORDER = 'backorder',         // Product is out of stock but can be backordered
  DISCONTINUED = 'discontinued'    // Product is no longer available
}

/**
 * Inventory History Entry Interface
 * Represents a change in inventory levels
 */
export interface InventoryHistoryEntry {
  id: string;                      // Unique identifier for the entry
  date: string;                    // Date of the inventory change
  previousStock: number;           // Stock level before the change
  newStock: number;                // Stock level after the change
  change: number;                  // Amount changed (positive for additions, negative for reductions)
  reason: InventoryChangeReason;   // Reason for the inventory change
  orderId?: string;                // Reference to order if change was due to an order
  userId?: string;                 // User who made the change
  notes?: string;                  // Additional notes about the change
}

/**
 * Inventory Change Reason Enum
 * Represents the possible reasons for inventory changes
 */
export enum InventoryChangeReason {
  SALE = 'sale',                   // Reduction due to a sale
  RETURN = 'return',               // Increase due to a return
  ADJUSTMENT = 'adjustment',       // Manual adjustment
  RESTOCK = 'restock',             // Increase due to restocking
  DAMAGED = 'damaged',             // Reduction due to damaged goods
  INITIAL = 'initial',             // Initial inventory setup
  SYNC = 'sync'                    // Adjustment from inventory sync
}

/**
 * Fulfillment Status Enum
 * Represents the possible states of an order item's fulfillment
 */
export enum FulfillmentStatus {
  PENDING = 'pending',             // Item not yet processed
  PROCESSING = 'processing',       // Item is being prepared
  READY = 'ready',                 // Item is ready for shipping
  SHIPPED = 'shipped',             // Item has been shipped
  DELIVERED = 'delivered',         // Item has been delivered
  BACKORDERED = 'backordered',     // Item is out of stock and backordered
  CANCELLED = 'cancelled',         // Item was cancelled
  RETURNED = 'returned',           // Item was returned by customer
  ON_HOLD = 'on_hold'              // Item is on hold
}

/**
 * Order Item Interface
 * Represents an individual item in an order
 */
export interface OrderItem {
  id: string;                    // Unique identifier for the order item
  productId: string;             // Reference to the product
  variantId?: string;            // Reference to the product variant if applicable
  name: string;                  // Product name at time of order
  price: number;                 // Price at time of order
  quantity: number;              // Quantity ordered
  image: string;                 // Product image URL
  selectedColor?: string;        // Selected color variant if applicable
  selectedSize?: string;         // Selected size variant if applicable
  sku?: string;                  // Product SKU at time of order
  subtotal: number;              // Price * quantity
  inventoryStatus?: InventoryStatus; // Inventory status at time of order
  backorderedQuantity?: number;  // Quantity that was backordered
  estimatedRestockDate?: string; // Estimated date when backordered items will be available
  fulfillmentStatus?: FulfillmentStatus; // Status of this specific item's fulfillment
}

/**
 * Shipping Address Interface
 * Represents a shipping address for an order
 */
export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

/**
 * Shipping Method Interface
 * Represents shipping method information
 */
export interface ShippingMethod {
  id: string;                    // Shipping method identifier
  name: string;                  // Shipping method name (e.g., "Standard", "Express")
  price: number;                 // Shipping cost
  estimatedDelivery?: string;    // Estimated delivery timeframe
}

/**
 * Tracking Information Interface
 * Represents tracking details for a shipped order
 */
export interface TrackingInfo {
  carrier: string;               // Shipping carrier (e.g., "UPS", "FedEx")
  trackingNumber: string;        // Tracking number
  trackingUrl?: string;          // URL to track the shipment
  shippedDate?: string;          // Date when the order was shipped
  estimatedDeliveryDate?: string; // Estimated delivery date
}

/**
 * Payment Information Interface
 * Represents payment details for an order
 */
export interface PaymentInfo {
  method: PaymentMethod;         // Payment method used
  provider: PaymentProvider;     // Payment provider (Stripe, PayPal, etc.)
  status: PaymentStatus;         // Current payment status
  transactionId?: string;        // Payment processor transaction ID
  paymentIntentId?: string;      // Payment intent ID (for Stripe)
  amount: number;                // Total amount paid
  currency: string;              // Currency code (e.g., "USD")
  datePaid?: string;             // Date when payment was made
  dateRefunded?: string;         // Date when payment was refunded (if applicable)
  lastFour?: string;             // Last four digits of credit card if applicable
  cardBrand?: string;            // Card brand if applicable (Visa, Mastercard, etc.)
  refundAmount?: number;         // Amount refunded if applicable
  lastError?: string;            // Last error message if payment failed
}

/**
 * Order Note Interface
 * Represents notes attached to an order
 */
export interface OrderNote {
  id: string;                    // Note identifier
  message: string;               // Note content
  createdAt: string;             // Date when note was created
  createdBy: string;             // User who created the note
  isCustomerVisible: boolean;    // Whether the note is visible to customers
}

/**
 * Order Interface
 * Represents a complete order in the system
 */
export interface Order {
  id: string;                    // Unique order identifier
  orderNumber: string;           // Human-readable order number (e.g., "OMJ-123456")
  userId?: string;               // Reference to user if order was placed by a registered user
  customerId?: string;           // Reference to customer in customers collection
  email: string;                 // Customer email
  status: OrderStatus;           // Current order status
  items: OrderItem[];            // Items in the order

  // Customer information
  customerName: string;          // Full customer name
  shippingAddress: ShippingAddress; // Shipping address
  billingAddress?: ShippingAddress; // Billing address (if different from shipping)

  // Pricing information
  subtotal: number;              // Sum of all item subtotals
  tax: number;                   // Tax amount
  shippingCost: number;          // Shipping cost
  discount?: number;             // Discount amount if applicable
  total: number;                 // Final order total

  // Shipping information
  shippingMethod: ShippingMethod; // Selected shipping method
  trackingInfo?: TrackingInfo;   // Tracking information if shipped

  // Payment information
  payment: PaymentInfo;          // Payment details

  // Additional information
  notes?: OrderNote[];           // Order notes
  couponCode?: string;           // Applied coupon code if any

  // Timestamps
  createdAt: string;             // Date when order was created
  updatedAt: string;             // Date when order was last updated

  // Flags
  isGuestOrder: boolean;         // Whether the order was placed by a guest
  requiresShipping: boolean;     // Whether the order requires shipping
}
