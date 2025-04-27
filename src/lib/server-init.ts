/**
 * Server initialization
 * This file contains code that should run once when the server starts
 */

// Import the memory monitor to initialize it
import './utils/memory-monitor';

// Import the Firebase admin to ensure it's initialized properly
import './firebase/admin';

// Set global limits for file descriptors
try {
  // Increase the event emitter limit to handle more concurrent connections
  require('events').EventEmitter.defaultMaxListeners = 30;
  
  // Log the initialization
  console.log('Server initialization complete');
} catch (error) {
  console.error('Error during server initialization:', error);
}

// Export a dummy function to allow importing this file
export function initServer() {
  // Server is initialized automatically when this file is imported
  return true;
}