/**
 * End-to-End Test: Admin Order Management
 * 
 * This test verifies that an admin can manage orders through the admin interface,
 * including viewing orders, updating status, and processing refunds.
 */

describe('Admin Order Management', () => {
  beforeEach(() => {
    // Clear cookies and local storage between tests
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Login as admin
    cy.visit('/admin/login');
    cy.get('[data-testid="email-input"]').type(Cypress.env('adminEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('adminPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Verify successful login
    cy.url().should('include', '/admin/dashboard');
  });

  it('should display the orders list with filtering options', () => {
    // Navigate to orders page
    cy.visit('/admin/orders');
    
    // Verify orders list is displayed
    cy.get('[data-testid="orders-table"]').should('be.visible');
    
    // Test search functionality
    cy.get('[data-testid="order-search"]').type('Test');
    cy.get('[data-testid="search-button"]').click();
    
    // Test status filter
    cy.get('[data-testid="status-filter"]').select('Processing');
    cy.get('[data-testid="filter-button"]').click();
    
    // Test date range filter
    cy.get('[data-testid="date-from"]').type('2023-01-01');
    cy.get('[data-testid="date-to"]').type('2023-12-31');
    cy.get('[data-testid="filter-button"]').click();
    
    // Reset filters
    cy.get('[data-testid="reset-filters"]').click();
    cy.get('[data-testid="orders-table"]').should('be.visible');
  });

  it('should allow viewing order details', () => {
    // Navigate to orders page
    cy.visit('/admin/orders');
    
    // Click on first order in the list
    cy.get('[data-testid="order-row"]').first().click();
    
    // Verify order details page is displayed
    cy.url().should('include', '/admin/orders/');
    cy.get('[data-testid="order-details"]').should('be.visible');
    cy.get('[data-testid="customer-info"]').should('be.visible');
    cy.get('[data-testid="order-items"]').should('be.visible');
    cy.get('[data-testid="payment-info"]').should('be.visible');
    cy.get('[data-testid="shipping-info"]').should('be.visible');
  });

  it('should allow updating order status', () => {
    // Navigate to orders page
    cy.visit('/admin/orders');
    
    // Click on first order in the list
    cy.get('[data-testid="order-row"]').first().click();
    
    // Update order status
    cy.get('[data-testid="status-dropdown"]').select('Processing');
    cy.get('[data-testid="update-status-button"]').click();
    
    // Verify status update confirmation
    cy.get('[data-testid="status-updated-message"]').should('be.visible');
    
    // Verify status is updated in the UI
    cy.get('[data-testid="current-status"]').should('contain', 'Processing');
  });

  it('should allow adding tracking information', () => {
    // Navigate to orders page
    cy.visit('/admin/orders');
    
    // Click on first order in the list
    cy.get('[data-testid="order-row"]').first().click();
    
    // Add tracking information
    cy.get('[data-testid="add-tracking-button"]').click();
    cy.get('[data-testid="tracking-carrier"]').select('UPS');
    cy.get('[data-testid="tracking-number"]').type('1Z999AA10123456784');
    cy.get('[data-testid="save-tracking-button"]').click();
    
    // Verify tracking information is saved
    cy.get('[data-testid="tracking-info"]').should('contain', 'UPS');
    cy.get('[data-testid="tracking-info"]').should('contain', '1Z999AA10123456784');
  });

  it('should allow processing a refund', () => {
    // Navigate to orders page
    cy.visit('/admin/orders');
    
    // Find a completed order
    cy.get('[data-testid="status-filter"]').select('Completed');
    cy.get('[data-testid="filter-button"]').click();
    
    // Click on first completed order
    cy.get('[data-testid="order-row"]').first().click();
    
    // Process a refund
    cy.get('[data-testid="refund-button"]').click();
    
    // Select partial refund
    cy.get('[data-testid="refund-type-partial"]').click();
    
    // Select first item for refund
    cy.get('[data-testid="refund-item-checkbox"]').first().check();
    
    // Enter refund reason
    cy.get('[data-testid="refund-reason"]').type('Customer request');
    
    // Process the refund
    cy.get('[data-testid="process-refund-button"]').click();
    
    // Verify refund confirmation
    cy.get('[data-testid="refund-confirmation"]').should('be.visible');
    
    // Verify refund is recorded in order history
    cy.get('[data-testid="order-history"]').should('contain', 'Partial refund processed');
  });

  it('should allow adding order notes', () => {
    // Navigate to orders page
    cy.visit('/admin/orders');
    
    // Click on first order in the list
    cy.get('[data-testid="order-row"]').first().click();
    
    // Add internal note
    cy.get('[data-testid="add-note-button"]').click();
    cy.get('[data-testid="note-type"]').select('Internal');
    cy.get('[data-testid="note-content"]').type('This is an internal note for testing');
    cy.get('[data-testid="save-note-button"]').click();
    
    // Verify internal note is added
    cy.get('[data-testid="order-notes"]').should('contain', 'This is an internal note for testing');
    
    // Add customer-visible note
    cy.get('[data-testid="add-note-button"]').click();
    cy.get('[data-testid="note-type"]').select('Customer Visible');
    cy.get('[data-testid="note-content"]').type('This is a note for the customer');
    cy.get('[data-testid="save-note-button"]').click();
    
    // Verify customer note is added
    cy.get('[data-testid="order-notes"]').should('contain', 'This is a note for the customer');
  });

  it('should allow generating shipping labels and packing slips', () => {
    // Navigate to orders page
    cy.visit('/admin/orders');
    
    // Click on first order in the list
    cy.get('[data-testid="order-row"]').first().click();
    
    // Generate shipping label
    cy.get('[data-testid="generate-label-button"]').click();
    
    // Verify label generation
    cy.get('[data-testid="shipping-label-preview"]').should('be.visible');
    
    // Generate packing slip
    cy.get('[data-testid="generate-packing-slip-button"]').click();
    
    // Verify packing slip generation
    cy.get('[data-testid="packing-slip-preview"]').should('be.visible');
  });
});