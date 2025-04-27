/**
 * Payment-related type definitions
 */

/**
 * Payment method types supported by the system
 */
export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

/**
 * Payment status values
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  CANCELLED = 'CANCELLED',
}

/**
 * Payment provider options
 */
export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  MANUAL = 'MANUAL',
}

/**
 * Payment information interface
 */
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  method: PaymentMethodType;
  transactionId?: string;
  paymentIntentId?: string;
  datePaid?: Date;
  dateRefunded?: Date;
  refundAmount?: number;
  lastError?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment intent request interface
 */
export interface PaymentIntentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, any>;
}

/**
 * Payment intent response interface
 */
export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

/**
 * Refund request interface
 */
export interface RefundRequest {
  paymentId: string;
  amount?: number; // If not provided, full refund is processed
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Refund response interface
 */
export interface RefundResponse {
  refundId: string;
  amount: number;
  status: string;
  currency: string;
}

/**
 * Payment method interface
 */
export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  isDefault: boolean;
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardBrand?: string;
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  providerData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}