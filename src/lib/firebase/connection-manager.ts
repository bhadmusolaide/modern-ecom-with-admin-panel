/**
 * Firebase connection manager
 * Helps manage and optimize Firebase connections to prevent "too many open files" errors
 */

import { auth, db } from './admin';

// Track active connections
let activeConnections = 0;
const MAX_CONNECTIONS = 100; // Adjust based on your system limits

// Track last activity time
let lastActivityTime = Date.now();
const IDLE_TIMEOUT = 60000; // 1 minute

/**
 * Get a database connection, tracking the connection count
 * @returns The Firestore database instance
 */
export function getDbConnection() {
  activeConnections++;
  lastActivityTime = Date.now();
  
  // Log connection count periodically
  if (activeConnections % 10 === 0) {
    console.log(`Active Firebase connections: ${activeConnections}`);
  }
  
  return db;
}

/**
 * Release a database connection
 */
export function releaseDbConnection() {
  if (activeConnections > 0) {
    activeConnections--;
  }
  lastActivityTime = Date.now();
}

/**
 * Get the auth connection, tracking the connection count
 * @returns The Firebase Auth instance
 */
export function getAuthConnection() {
  activeConnections++;
  lastActivityTime = Date.now();
  return auth;
}

/**
 * Check if the system is under high connection load
 * @returns Boolean indicating if the system is under high load
 */
export function isHighLoad() {
  return activeConnections > MAX_CONNECTIONS * 0.8;
}

// Set up a periodic check to log connection status
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    const idleTime = Date.now() - lastActivityTime;
    
    // Log connection status if there are active connections or every 5 minutes
    if (activeConnections > 0 || idleTime > 300000) {
      console.log(`Firebase connection status: ${activeConnections} active connections, idle for ${Math.round(idleTime / 1000)}s`);
    }
    
    // If system has been idle for a while, reset the connection count
    // This helps recover from potential leaks
    if (idleTime > IDLE_TIMEOUT && activeConnections > 0) {
      console.log(`Resetting connection count after ${Math.round(idleTime / 1000)}s of inactivity`);
      activeConnections = 0;
    }
  }, 60000); // Check every minute
}