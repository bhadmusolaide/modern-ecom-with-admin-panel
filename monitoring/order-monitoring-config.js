/**
 * Order Management System Monitoring Configuration
 *
 * This file configures monitoring and alerting for the Yours E-commerce Order Management System.
 * It sets up Firebase Performance Monitoring, Logging, and custom alert thresholds.
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { PubSub } = require('@google-cloud/pubsub');
const axios = require('axios');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize PubSub for alert notifications
const pubsub = new PubSub();

// Alert configuration
const alertConfig = {
  // Error rate thresholds (percentage)
  errorRates: {
    orderCreation: 5, // Alert if >5% of order creations fail
    paymentProcessing: 2, // Alert if >2% of payments fail
    orderFulfillment: 3, // Alert if >3% of fulfillment operations fail
    inventoryUpdates: 1, // Alert if >1% of inventory updates fail
  },

  // Performance thresholds (milliseconds)
  performance: {
    orderCreation: 3000, // Alert if order creation takes >3s
    checkoutPage: 2000, // Alert if checkout page load takes >2s
    paymentProcessing: 5000, // Alert if payment processing takes >5s
    orderListLoading: 1000, // Alert if order list loading takes >1s
    orderDetailLoading: 800, // Alert if order detail loading takes >800ms
  },

  // Volume thresholds (count per minute)
  volume: {
    orderCreationMax: 1000, // Alert if >1000 orders created per minute (potential DoS)
    orderCreationMin: 1, // Alert if <1 order per minute during business hours (potential outage)
    paymentFailures: 10, // Alert if >10 payment failures per minute
    inventoryAlerts: 20, // Alert if >20 low inventory alerts per minute
  },

  // Business thresholds
  business: {
    abandonedCartRate: 70, // Alert if >70% of carts are abandoned
    orderCancellationRate: 10, // Alert if >10% of orders are cancelled
    averageOrderValueDrop: 20, // Alert if average order value drops by >20%
    highValueOrderDelay: 15, // Alert if high-value orders aren't processed within 15 minutes
  }
};

// Notification channels
const notificationChannels = {
  critical: {
    email: ['alerts-critical@yours-ecom.com', 'tech-ops@yours-ecom.com'],
    slack: process.env.SLACK_WEBHOOK_URL || 'your-slack-webhook-url',
    sms: ['+15551234567', '+15551234568'],
    pagerDuty: process.env.PAGERDUTY_INTEGRATION_URL || 'your-pagerduty-integration-url',
  },
  warning: {
    email: ['alerts-warning@yours-ecom.com'],
    slack: process.env.SLACK_WARNING_WEBHOOK_URL || 'your-slack-warning-webhook-url',
  },
  info: {
    email: ['alerts-info@yours-ecom.com'],
    slack: process.env.SLACK_INFO_WEBHOOK_URL || 'your-slack-info-webhook-url',
  }
};

// Business hours (for certain alerts)
const businessHours = {
  start: 9, // 9 AM
  end: 21, // 9 PM
  timezone: 'America/New_York',
  daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Monday to Sunday
};

// Custom metrics to track
const customMetrics = [
  {
    name: 'order_creation_success_rate',
    description: 'Percentage of successful order creations',
    calculation: 'successful_orders / total_order_attempts * 100',
    alertThreshold: alertConfig.errorRates.orderCreation,
    alertSeverity: 'critical',
  },
  {
    name: 'payment_success_rate',
    description: 'Percentage of successful payment transactions',
    calculation: 'successful_payments / total_payment_attempts * 100',
    alertThreshold: alertConfig.errorRates.paymentProcessing,
    alertSeverity: 'critical',
  },
  {
    name: 'inventory_accuracy',
    description: 'Percentage of inventory updates that match actual stock',
    calculation: 'accurate_inventory_counts / total_inventory_checks * 100',
    alertThreshold: 95, // Alert if accuracy falls below 95%
    alertSeverity: 'warning',
  },
  {
    name: 'order_fulfillment_time',
    description: 'Average time from order placement to shipping',
    calculation: 'sum(shipping_time - order_time) / total_shipped_orders',
    alertThreshold: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    alertSeverity: 'warning',
  },
  {
    name: 'abandoned_cart_rate',
    description: 'Percentage of carts that are abandoned',
    calculation: 'abandoned_carts / total_carts * 100',
    alertThreshold: alertConfig.business.abandonedCartRate,
    alertSeverity: 'warning',
  }
];

// Log categories for order system
const logCategories = {
  ORDER_CREATION: 'order-creation',
  PAYMENT_PROCESSING: 'payment-processing',
  INVENTORY_MANAGEMENT: 'inventory-management',
  ORDER_FULFILLMENT: 'order-fulfillment',
  CUSTOMER_COMMUNICATION: 'customer-communication',
  ADMIN_ACTIONS: 'admin-actions',
  SYSTEM_ERRORS: 'system-errors',
};

// Log levels
const logLevels = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Logs an order-related event with structured data
 * @param {string} category - Log category
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional structured data
 */
function logOrderEvent(category, level, message, data = {}) {
  const logData = {
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    category,
    level,
    message,
    data,
  };

  // Log to Firestore
  admin.firestore().collection('system_logs').add(logData)
    .catch(error => console.error('Error writing to logs:', error));

  // Log to Firebase Functions logger
  const logMethod = level === logLevels.ERROR || level === logLevels.CRITICAL
    ? console.error
    : level === logLevels.WARNING
      ? console.warn
      : console.log;

  logMethod(`[${category}] ${message}`, data);

  // For critical errors, also send to error reporting
  if (level === logLevels.CRITICAL || level === logLevels.ERROR) {
    // Check if we need to trigger an alert
    checkAndTriggerAlert(category, level, message, data);
  }
}

/**
 * Checks if an alert should be triggered and sends notifications
 * @param {string} category - Log category
 * @param {string} level - Log level
 * @param {string} message - Alert message
 * @param {Object} data - Additional alert data
 */
async function checkAndTriggerAlert(category, level, message, data) {
  // Determine alert severity
  let severity;
  if (level === logLevels.CRITICAL) {
    severity = 'critical';
  } else if (level === logLevels.ERROR) {
    severity = 'warning';
  } else {
    severity = 'info';
  }

  // Get notification channels for this severity
  const channels = notificationChannels[severity];

  // Create alert payload
  const alertPayload = {
    timestamp: new Date().toISOString(),
    category,
    level,
    message,
    data,
    severity,
  };

  // Send to PubSub for processing
  try {
    const dataBuffer = Buffer.from(JSON.stringify(alertPayload));
    await pubsub.topic('order-system-alerts').publish(dataBuffer);

    // For critical alerts, also send directly to notification channels
    if (severity === 'critical') {
      // Send to Slack
      if (channels.slack) {
        await axios.post(channels.slack, {
          text: `🚨 CRITICAL ALERT: ${message}`,
          attachments: [
            {
              color: '#FF0000',
              fields: [
                {
                  title: 'Category',
                  value: category,
                  short: true,
                },
                {
                  title: 'Time',
                  value: new Date().toLocaleString(),
                  short: true,
                },
                {
                  title: 'Details',
                  value: JSON.stringify(data, null, 2),
                  short: false,
                },
              ],
            },
          ],
        });
      }

      // Send to PagerDuty
      if (channels.pagerDuty) {
        await axios.post(channels.pagerDuty, {
          event_action: 'trigger',
          payload: {
            summary: `CRITICAL: ${message}`,
            source: 'Order Management System',
            severity: 'critical',
            custom_details: data,
          },
          routing_key: channels.pagerDuty,
        });
      }
    }
  } catch (error) {
    console.error('Error sending alert:', error);
  }
}

/**
 * Registers performance monitoring for order-related operations
 */
function registerPerformanceMonitoring() {
  // These functions would be called at appropriate points in the application

  // Example usage in order creation flow:
  // const orderCreationTrace = firebase.performance().trace('orderCreation');
  // orderCreationTrace.start();
  // ... order creation logic ...
  // orderCreationTrace.stop();

  // Define custom traces for Firebase Performance Monitoring
  const performanceTraces = [
    {
      name: 'orderCreation',
      description: 'Time taken to create an order',
      threshold: alertConfig.performance.orderCreation,
    },
    {
      name: 'paymentProcessing',
      description: 'Time taken to process a payment',
      threshold: alertConfig.performance.paymentProcessing,
    },
    {
      name: 'checkoutPageLoad',
      description: 'Time taken to load the checkout page',
      threshold: alertConfig.performance.checkoutPage,
    },
    {
      name: 'orderListLoad',
      description: 'Time taken to load the order list',
      threshold: alertConfig.performance.orderListLoading,
    },
    {
      name: 'orderDetailLoad',
      description: 'Time taken to load order details',
      threshold: alertConfig.performance.orderDetailLoading,
    },
    {
      name: 'inventoryUpdate',
      description: 'Time taken to update inventory',
      threshold: 500, // 500ms
    },
    {
      name: 'orderStatusUpdate',
      description: 'Time taken to update order status',
      threshold: 1000, // 1s
    },
  ];

  // Log the registered traces
  console.log('Registered performance traces:', performanceTraces.map(t => t.name).join(', '));

  return performanceTraces;
}

/**
 * Sets up real-time monitoring for order-related errors
 */
function setupErrorMonitoring() {
  // Monitor Firestore for order processing errors
  const orderErrorsQuery = admin.firestore()
    .collection('system_logs')
    .where('category', 'in', [
      logCategories.ORDER_CREATION,
      logCategories.PAYMENT_PROCESSING,
      logCategories.INVENTORY_MANAGEMENT,
      logCategories.ORDER_FULFILLMENT
    ])
    .where('level', 'in', [logLevels.ERROR, logLevels.CRITICAL]);

  // This would be set up as a Cloud Function trigger in production
  // For demonstration purposes, we're just defining the query here

  return {
    orderErrorsQuery,
    // Add other error monitoring queries as needed
  };
}

/**
 * Sets up monitoring for payment processing issues
 */
function setupPaymentMonitoring() {
  // Monitor for payment failures
  const paymentFailuresQuery = admin.firestore()
    .collection('payments')
    .where('status', '==', 'failed')
    .orderBy('timestamp', 'desc')
    .limit(100);

  // Monitor for payment gateway timeouts
  const paymentTimeoutsQuery = admin.firestore()
    .collection('system_logs')
    .where('category', '==', logCategories.PAYMENT_PROCESSING)
    .where('data.errorType', '==', 'timeout')
    .orderBy('timestamp', 'desc')
    .limit(50);

  // Monitor for payment fraud alerts
  const paymentFraudQuery = admin.firestore()
    .collection('payments')
    .where('fraudScore', '>=', 80) // High fraud score
    .orderBy('timestamp', 'desc')
    .limit(50);

  return {
    paymentFailuresQuery,
    paymentTimeoutsQuery,
    paymentFraudQuery,
  };
}

/**
 * Sets up monitoring for system performance under load
 */
function setupLoadMonitoring() {
  // Define key performance indicators to monitor
  const performanceKPIs = [
    {
      name: 'order_creation_rate',
      description: 'Number of orders created per minute',
      query: admin.firestore()
        .collection('orders')
        .orderBy('dates.created', 'desc')
        .limit(1000),
      calculation: 'Count orders created in the last minute',
      alertThresholds: {
        min: alertConfig.volume.orderCreationMin,
        max: alertConfig.volume.orderCreationMax,
      },
    },
    {
      name: 'checkout_conversion_rate',
      description: 'Percentage of checkouts that convert to orders',
      calculation: 'orders_created / checkout_initiated * 100',
      alertThreshold: 30, // Alert if conversion rate falls below 30%
    },
    {
      name: 'database_read_operations',
      description: 'Number of Firestore read operations per minute',
      alertThreshold: 50000, // Alert if exceeding 50,000 reads per minute
    },
    {
      name: 'database_write_operations',
      description: 'Number of Firestore write operations per minute',
      alertThreshold: 20000, // Alert if exceeding 20,000 writes per minute
    },
    {
      name: 'api_error_rate',
      description: 'Percentage of API requests that result in errors',
      calculation: 'error_responses / total_requests * 100',
      alertThreshold: 5, // Alert if error rate exceeds 5%
    },
  ];

  return {
    performanceKPIs,
  };
}

/**
 * Creates a dashboard configuration for order monitoring
 */
function createMonitoringDashboard() {
  // This would typically be used to configure a monitoring dashboard
  // For demonstration purposes, we're just defining the configuration here

  const dashboardConfig = {
    title: 'Order Management System Monitoring',
    refreshRate: 60, // seconds
    panels: [
      {
        title: 'Order Creation Rate',
        type: 'lineChart',
        metric: 'order_creation_rate',
        timeRange: '24h',
      },
      {
        title: 'Payment Success Rate',
        type: 'gaugeChart',
        metric: 'payment_success_rate',
        thresholds: [
          { value: 95, color: 'green' },
          { value: 90, color: 'yellow' },
          { value: 0, color: 'red' },
        ],
      },
      {
        title: 'Recent Order Errors',
        type: 'logList',
        query: 'category:"order-creation" level:"error" OR level:"critical"',
        limit: 10,
      },
      {
        title: 'Order Processing Time',
        type: 'lineChart',
        metric: 'order_fulfillment_time',
        timeRange: '7d',
      },
      {
        title: 'Inventory Accuracy',
        type: 'gaugeChart',
        metric: 'inventory_accuracy',
        thresholds: [
          { value: 99, color: 'green' },
          { value: 95, color: 'yellow' },
          { value: 0, color: 'red' },
        ],
      },
      {
        title: 'System Load',
        type: 'lineChart',
        metrics: ['database_read_operations', 'database_write_operations'],
        timeRange: '1h',
      },
    ],
  };

  return dashboardConfig;
}

// Export all monitoring functions
module.exports = {
  alertConfig,
  notificationChannels,
  businessHours,
  customMetrics,
  logCategories,
  logLevels,
  logOrderEvent,
  checkAndTriggerAlert,
  registerPerformanceMonitoring,
  setupErrorMonitoring,
  setupPaymentMonitoring,
  setupLoadMonitoring,
  createMonitoringDashboard,
};