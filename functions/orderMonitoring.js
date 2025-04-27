const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const { PubSub } = require('@google-cloud/pubsub');

// Import monitoring configuration
const monitoringConfig = require('../monitoring/order-monitoring-config');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize PubSub
const pubsub = new PubSub();

/**
 * Cloud Function that monitors for order-related errors and triggers alerts
 * This function runs on a schedule (every 5 minutes)
 */
exports.monitorOrderErrors = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  try {
    const now = admin.firestore.Timestamp.now();
    const fiveMinutesAgo = new admin.firestore.Timestamp(
      now.seconds - 5 * 60,
      now.nanoseconds
    );
    
    // Query for recent order-related errors
    const errorLogsSnapshot = await admin.firestore()
      .collection('system_logs')
      .where('timestamp', '>=', fiveMinutesAgo)
      .where('level', 'in', [monitoringConfig.logLevels.ERROR, monitoringConfig.logLevels.CRITICAL])
      .where('category', 'in', [
        monitoringConfig.logCategories.ORDER_CREATION,
        monitoringConfig.logCategories.PAYMENT_PROCESSING,
        monitoringConfig.logCategories.INVENTORY_MANAGEMENT,
        monitoringConfig.logCategories.ORDER_FULFILLMENT
      ])
      .get();
    
    if (errorLogsSnapshot.empty) {
      console.log('No order-related errors detected in the last 5 minutes');
      return null;
    }
    
    // Group errors by category
    const errorsByCategory = {};
    errorLogsSnapshot.forEach(doc => {
      const error = doc.data();
      if (!errorsByCategory[error.category]) {
        errorsByCategory[error.category] = [];
      }
      errorsByCategory[error.category].push(error);
    });
    
    // Check if error rates exceed thresholds
    const alerts = [];
    
    // For each category, calculate error rate and check against threshold
    for (const [category, errors] of Object.entries(errorsByCategory)) {
      // Get total operations for this category in the last 5 minutes
      let totalOperationsSnapshot;
      
      switch (category) {
        case monitoringConfig.logCategories.ORDER_CREATION:
          totalOperationsSnapshot = await admin.firestore()
            .collection('orders')
            .where('dates.created', '>=', fiveMinutesAgo)
            .count()
            .get();
          break;
        
        case monitoringConfig.logCategories.PAYMENT_PROCESSING:
          totalOperationsSnapshot = await admin.firestore()
            .collection('payments')
            .where('timestamp', '>=', fiveMinutesAgo)
            .count()
            .get();
          break;
        
        case monitoringConfig.logCategories.INVENTORY_MANAGEMENT:
          totalOperationsSnapshot = await admin.firestore()
            .collection('inventory_updates')
            .where('timestamp', '>=', fiveMinutesAgo)
            .count()
            .get();
          break;
        
        case monitoringConfig.logCategories.ORDER_FULFILLMENT:
          totalOperationsSnapshot = await admin.firestore()
            .collection('orders')
            .where('dates.updated', '>=', fiveMinutesAgo)
            .where('status', 'in', ['processing', 'shipped', 'delivered'])
            .count()
            .get();
          break;
      }
      
      const totalOperations = totalOperationsSnapshot ? totalOperationsSnapshot.data().count : 0;
      
      // If there were operations, calculate error rate
      if (totalOperations > 0) {
        const errorRate = (errors.length / totalOperations) * 100;
        
        // Check if error rate exceeds threshold
        let threshold;
        switch (category) {
          case monitoringConfig.logCategories.ORDER_CREATION:
            threshold = monitoringConfig.alertConfig.errorRates.orderCreation;
            break;
          
          case monitoringConfig.logCategories.PAYMENT_PROCESSING:
            threshold = monitoringConfig.alertConfig.errorRates.paymentProcessing;
            break;
          
          case monitoringConfig.logCategories.INVENTORY_MANAGEMENT:
            threshold = monitoringConfig.alertConfig.errorRates.inventoryUpdates;
            break;
          
          case monitoringConfig.logCategories.ORDER_FULFILLMENT:
            threshold = monitoringConfig.alertConfig.errorRates.orderFulfillment;
            break;
        }
        
        if (errorRate > threshold) {
          alerts.push({
            category,
            errorRate,
            threshold,
            errorCount: errors.length,
            totalOperations,
            errors: errors.slice(0, 10), // Include up to 10 sample errors
          });
        }
      } else if (errors.length > 0) {
        // If there were errors but no operations counted, still alert
        alerts.push({
          category,
          errorRate: 100, // 100% error rate if there were errors but no successful operations
          threshold: 0,
          errorCount: errors.length,
          totalOperations: 0,
          errors: errors.slice(0, 10), // Include up to 10 sample errors
        });
      }
    }
    
    // If there are alerts, send notifications
    if (alerts.length > 0) {
      for (const alert of alerts) {
        await sendAlertNotification(alert);
      }
      
      console.log(`Sent ${alerts.length} alert notifications for order-related errors`);
    } else {
      console.log('Error rates within acceptable thresholds');
    }
    
    return null;
  } catch (error) {
    console.error('Error monitoring order errors:', error);
    return null;
  }
});

/**
 * Cloud Function that monitors payment processing issues
 * This function runs on a schedule (every 5 minutes)
 */
exports.monitorPaymentIssues = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  try {
    const now = admin.firestore.Timestamp.now();
    const fiveMinutesAgo = new admin.firestore.Timestamp(
      now.seconds - 5 * 60,
      now.nanoseconds
    );
    
    // Query for recent payment failures
    const paymentFailuresSnapshot = await admin.firestore()
      .collection('payments')
      .where('timestamp', '>=', fiveMinutesAgo)
      .where('status', '==', 'failed')
      .get();
    
    // Query for total payment attempts
    const totalPaymentsSnapshot = await admin.firestore()
      .collection('payments')
      .where('timestamp', '>=', fiveMinutesAgo)
      .count()
      .get();
    
    const failedPayments = paymentFailuresSnapshot.docs.map(doc => doc.data());
    const totalPayments = totalPaymentsSnapshot.data().count;
    
    if (totalPayments === 0) {
      console.log('No payment attempts in the last 5 minutes');
      return null;
    }
    
    const failureRate = (failedPayments.length / totalPayments) * 100;
    
    // Check if failure rate exceeds threshold
    if (failureRate > monitoringConfig.alertConfig.errorRates.paymentProcessing) {
      // Group failures by error type
      const failuresByType = {};
      failedPayments.forEach(payment => {
        const errorType = payment.errorType || 'unknown';
        if (!failuresByType[errorType]) {
          failuresByType[errorType] = [];
        }
        failuresByType[errorType].push(payment);
      });
      
      // Create alert
      const alert = {
        category: monitoringConfig.logCategories.PAYMENT_PROCESSING,
        failureRate,
        threshold: monitoringConfig.alertConfig.errorRates.paymentProcessing,
        failureCount: failedPayments.length,
        totalPayments,
        failuresByType,
        sampleFailures: failedPayments.slice(0, 10), // Include up to 10 sample failures
      };
      
      // Send alert notification
      await sendAlertNotification(alert);
      
      console.log(`Sent alert notification for payment processing issues (${failureRate.toFixed(2)}% failure rate)`);
    } else {
      console.log(`Payment failure rate (${failureRate.toFixed(2)}%) within acceptable threshold`);
    }
    
    return null;
  } catch (error) {
    console.error('Error monitoring payment issues:', error);
    return null;
  }
});

/**
 * Cloud Function that monitors system performance under load
 * This function runs on a schedule (every 5 minutes)
 */
exports.monitorSystemPerformance = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  try {
    const now = admin.firestore.Timestamp.now();
    const fiveMinutesAgo = new admin.firestore.Timestamp(
      now.seconds - 5 * 60,
      now.nanoseconds
    );
    
    // Get performance metrics from the last 5 minutes
    const performanceMetricsSnapshot = await admin.firestore()
      .collection('performance_metrics')
      .where('timestamp', '>=', fiveMinutesAgo)
      .get();
    
    if (performanceMetricsSnapshot.empty) {
      console.log('No performance metrics recorded in the last 5 minutes');
      return null;
    }
    
    // Process performance metrics
    const metrics = {};
    performanceMetricsSnapshot.forEach(doc => {
      const data = doc.data();
      const metricName = data.name;
      
      if (!metrics[metricName]) {
        metrics[metricName] = {
          values: [],
          sum: 0,
          count: 0,
          min: Number.MAX_VALUE,
          max: Number.MIN_VALUE,
        };
      }
      
      metrics[metricName].values.push(data.value);
      metrics[metricName].sum += data.value;
      metrics[metricName].count += 1;
      metrics[metricName].min = Math.min(metrics[metricName].min, data.value);
      metrics[metricName].max = Math.max(metrics[metricName].max, data.value);
    });
    
    // Calculate averages and check against thresholds
    const alerts = [];
    
    for (const [metricName, metricData] of Object.entries(metrics)) {
      metricData.average = metricData.sum / metricData.count;
      
      // Check against thresholds
      let threshold;
      
      switch (metricName) {
        case 'orderCreation':
          threshold = monitoringConfig.alertConfig.performance.orderCreation;
          break;
        
        case 'checkoutPage':
          threshold = monitoringConfig.alertConfig.performance.checkoutPage;
          break;
        
        case 'paymentProcessing':
          threshold = monitoringConfig.alertConfig.performance.paymentProcessing;
          break;
        
        case 'orderListLoading':
          threshold = monitoringConfig.alertConfig.performance.orderListLoading;
          break;
        
        case 'orderDetailLoading':
          threshold = monitoringConfig.alertConfig.performance.orderDetailLoading;
          break;
        
        default:
          // Default threshold for other metrics
          threshold = 1000; // 1 second
      }
      
      if (metricData.average > threshold) {
        alerts.push({
          metricName,
          average: metricData.average,
          threshold,
          min: metricData.min,
          max: metricData.max,
          sampleCount: metricData.count,
        });
      }
    }
    
    // If there are alerts, send notifications
    if (alerts.length > 0) {
      for (const alert of alerts) {
        await sendPerformanceAlertNotification(alert);
      }
      
      console.log(`Sent ${alerts.length} alert notifications for performance issues`);
    } else {
      console.log('All performance metrics within acceptable thresholds');
    }
    
    // Store aggregated metrics for historical analysis
    await admin.firestore().collection('aggregated_metrics').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      timeframe: '5min',
      metrics,
    });
    
    return null;
  } catch (error) {
    console.error('Error monitoring system performance:', error);
    return null;
  }
});

/**
 * Cloud Function that processes order system alerts from PubSub
 */
exports.processOrderAlerts = functions.pubsub.topic('order-system-alerts').onPublish(async (message) => {
  try {
    const alertData = message.json;
    
    // Log the alert
    console.log('Processing order system alert:', alertData);
    
    // Store the alert in Firestore
    await admin.firestore().collection('system_alerts').add({
      ...alertData,
      processed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Determine notification channels based on severity
    const channels = monitoringConfig.notificationChannels[alertData.severity] || monitoringConfig.notificationChannels.info;
    
    // Send notifications to all configured channels
    const notificationPromises = [];
    
    // Email notifications
    if (channels.email && channels.email.length > 0) {
      // In a real implementation, this would send emails via SendGrid, Mailgun, etc.
      console.log(`Would send email to ${channels.email.join(', ')}`);
    }
    
    // Slack notifications
    if (channels.slack) {
      notificationPromises.push(
        axios.post(channels.slack, {
          text: `${alertData.severity === 'critical' ? '🚨' : '⚠️'} ${alertData.severity.toUpperCase()}: ${alertData.message}`,
          attachments: [
            {
              color: alertData.severity === 'critical' ? '#FF0000' : alertData.severity === 'warning' ? '#FFA500' : '#36a64f',
              fields: [
                {
                  title: 'Category',
                  value: alertData.category,
                  short: true,
                },
                {
                  title: 'Time',
                  value: new Date().toLocaleString(),
                  short: true,
                },
                {
                  title: 'Details',
                  value: JSON.stringify(alertData.data, null, 2),
                  short: false,
                },
              ],
            },
          ],
        })
      );
    }
    
    // SMS notifications for critical alerts
    if (alertData.severity === 'critical' && channels.sms && channels.sms.length > 0) {
      // In a real implementation, this would send SMS via Twilio, etc.
      console.log(`Would send SMS to ${channels.sms.join(', ')}`);
    }
    
    // PagerDuty for critical alerts
    if (alertData.severity === 'critical' && channels.pagerDuty) {
      notificationPromises.push(
        axios.post(channels.pagerDuty, {
          event_action: 'trigger',
          payload: {
            summary: `CRITICAL: ${alertData.message}`,
            source: 'Order Management System',
            severity: 'critical',
            custom_details: alertData.data,
          },
          routing_key: channels.pagerDuty,
        })
      );
    }
    
    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);
    
    // Update the alert as processed
    await admin.firestore().collection('system_alerts')
      .where('createdAt', '==', alertData.createdAt)
      .get()
      .then(snapshot => {
        if (!snapshot.empty) {
          snapshot.docs[0].ref.update({ processed: true });
        }
      });
    
    return null;
  } catch (error) {
    console.error('Error processing order alert:', error);
    return null;
  }
});

/**
 * Sends an alert notification for order-related errors
 * @param {Object} alert - Alert data
 */
async function sendAlertNotification(alert) {
  try {
    // Determine severity based on error rate
    let severity;
    if (alert.errorRate >= 2 * alert.threshold) {
      severity = 'critical';
    } else if (alert.errorRate >= alert.threshold) {
      severity = 'warning';
    } else {
      severity = 'info';
    }
    
    // Create alert message
    let message;
    switch (alert.category) {
      case monitoringConfig.logCategories.ORDER_CREATION:
        message = `High order creation failure rate: ${alert.errorRate.toFixed(2)}% (threshold: ${alert.threshold}%)`;
        break;
      
      case monitoringConfig.logCategories.PAYMENT_PROCESSING:
        message = `High payment processing failure rate: ${alert.errorRate.toFixed(2)}% (threshold: ${alert.threshold}%)`;
        break;
      
      case monitoringConfig.logCategories.INVENTORY_MANAGEMENT:
        message = `High inventory update failure rate: ${alert.errorRate.toFixed(2)}% (threshold: ${alert.threshold}%)`;
        break;
      
      case monitoringConfig.logCategories.ORDER_FULFILLMENT:
        message = `High order fulfillment failure rate: ${alert.errorRate.toFixed(2)}% (threshold: ${alert.threshold}%)`;
        break;
      
      default:
        message = `High error rate in ${alert.category}: ${alert.errorRate.toFixed(2)}% (threshold: ${alert.threshold}%)`;
    }
    
    // Create alert data
    const alertData = {
      timestamp: new Date().toISOString(),
      category: alert.category,
      message,
      data: {
        errorRate: alert.errorRate,
        threshold: alert.threshold,
        errorCount: alert.errorCount,
        totalOperations: alert.totalOperations,
        sampleErrors: alert.errors,
      },
      severity,
    };
    
    // Publish alert to PubSub
    const dataBuffer = Buffer.from(JSON.stringify(alertData));
    await pubsub.topic('order-system-alerts').publish(dataBuffer);
    
    console.log(`Published ${severity} alert for ${alert.category}`);
  } catch (error) {
    console.error('Error sending alert notification:', error);
  }
}

/**
 * Sends an alert notification for performance issues
 * @param {Object} alert - Alert data
 */
async function sendPerformanceAlertNotification(alert) {
  try {
    // Determine severity based on how much the average exceeds the threshold
    let severity;
    if (alert.average >= 2 * alert.threshold) {
      severity = 'critical';
    } else if (alert.average >= alert.threshold) {
      severity = 'warning';
    } else {
      severity = 'info';
    }
    
    // Create alert message
    const message = `Slow performance detected in ${alert.metricName}: ${alert.average.toFixed(2)}ms (threshold: ${alert.threshold}ms)`;
    
    // Create alert data
    const alertData = {
      timestamp: new Date().toISOString(),
      category: 'performance',
      message,
      data: {
        metricName: alert.metricName,
        average: alert.average,
        threshold: alert.threshold,
        min: alert.min,
        max: alert.max,
        sampleCount: alert.sampleCount,
      },
      severity,
    };
    
    // Publish alert to PubSub
    const dataBuffer = Buffer.from(JSON.stringify(alertData));
    await pubsub.topic('order-system-alerts').publish(dataBuffer);
    
    console.log(`Published ${severity} performance alert for ${alert.metricName}`);
  } catch (error) {
    console.error('Error sending performance alert notification:', error);
  }
}