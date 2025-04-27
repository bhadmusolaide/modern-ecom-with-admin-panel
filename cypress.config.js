const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    // Test user credentials
    adminEmail: 'admin@yours-ecom.com',
    adminPassword: 'test-admin-password', // Replace with actual test password
    customerEmail: 'customer@example.com',
    customerPassword: 'test-customer-password', // Replace with actual test password
  },
});