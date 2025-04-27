/**
 * End-to-End Test: Inventory Management
 * 
 * This test verifies that inventory is correctly managed through the admin interface,
 * including stock updates, low stock alerts, and inventory history.
 */

describe('Inventory Management', () => {
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

  it('should display current inventory levels', () => {
    // Navigate to inventory management
    cy.visit('/admin/products');
    
    // Verify inventory column is displayed
    cy.get('[data-testid="products-table"]').should('be.visible');
    cy.get('[data-testid="inventory-column"]').should('be.visible');
    
    // Check inventory filter
    cy.get('[data-testid="inventory-filter"]').select('Low Stock');
    cy.get('[data-testid="filter-button"]').click();
    
    // Verify low stock products are displayed
    cy.get('[data-testid="low-stock-indicator"]').should('be.visible');
  });

  it('should allow manual inventory adjustment', () => {
    // Navigate to products page
    cy.visit('/admin/products');
    
    // Click on first product in the list
    cy.get('[data-testid="product-row"]').first().click();
    
    // Navigate to inventory tab
    cy.get('[data-testid="inventory-tab"]').click();
    
    // Get current inventory level
    let currentInventory;
    cy.get('[data-testid="current-inventory"]').then(($el) => {
      currentInventory = parseInt($el.text());
    });
    
    // Adjust inventory
    cy.get('[data-testid="adjust-inventory-button"]').click();
    cy.get('[data-testid="adjustment-type"]').select('Add');
    cy.get('[data-testid="adjustment-quantity"]').type('5');
    cy.get('[data-testid="adjustment-reason"]').select('Received from supplier');
    cy.get('[data-testid="adjustment-notes"]').type('E2E test inventory adjustment');
    cy.get('[data-testid="save-adjustment-button"]').click();
    
    // Verify inventory is updated
    cy.get('[data-testid="current-inventory"]').should(($el) => {
      const newInventory = parseInt($el.text());
      expect(newInventory).to.equal(currentInventory + 5);
    });
    
    // Verify adjustment is recorded in history
    cy.get('[data-testid="inventory-history"]').should('contain', 'Received from supplier');
    cy.get('[data-testid="inventory-history"]').should('contain', '+5');
  });

  it('should handle variant-level inventory', () => {
    // Navigate to products with variants
    cy.visit('/admin/products');
    
    // Filter for products with variants
    cy.get('[data-testid="product-type-filter"]').select('With Variants');
    cy.get('[data-testid="filter-button"]').click();
    
    // Click on first product with variants
    cy.get('[data-testid="product-row"]').first().click();
    
    // Navigate to variants tab
    cy.get('[data-testid="variants-tab"]').click();
    
    // Verify variant inventory is displayed
    cy.get('[data-testid="variant-inventory"]').should('be.visible');
    
    // Adjust inventory for first variant
    cy.get('[data-testid="variant-row"]').first().within(() => {
      cy.get('[data-testid="adjust-variant-inventory"]').click();
    });
    
    // Enter adjustment details
    cy.get('[data-testid="variant-adjustment-quantity"]').type('3');
    cy.get('[data-testid="variant-adjustment-reason"]').select('Received from supplier');
    cy.get('[data-testid="save-variant-adjustment"]').click();
    
    // Verify variant inventory is updated
    cy.get('[data-testid="variant-row"]').first().within(() => {
      cy.get('[data-testid="variant-inventory-value"]').should('contain', '3');
    });
  });

  it('should display low stock alerts', () => {
    // Navigate to dashboard
    cy.visit('/admin/dashboard');
    
    // Verify low stock widget is displayed
    cy.get('[data-testid="low-stock-widget"]').should('be.visible');
    
    // Click on low stock widget
    cy.get('[data-testid="low-stock-widget"]').click();
    
    // Verify low stock products page is displayed
    cy.url().should('include', '/admin/products');
    cy.url().should('include', 'filter=low-stock');
    
    // Verify low stock products are displayed
    cy.get('[data-testid="low-stock-indicator"]').should('be.visible');
  });

  it('should update inventory when order is placed', () => {
    // Get product for testing
    let productId;
    let initialInventory;
    
    // Navigate to products page
    cy.visit('/admin/products');
    
    // Find a product with sufficient inventory
    cy.get('[data-testid="product-row"]').first().within(() => {
      cy.get('[data-testid="inventory-value"]').then(($el) => {
        initialInventory = parseInt($el.text());
        if (initialInventory > 0) {
          cy.get('[data-testid="product-id"]').then(($id) => {
            productId = $id.text();
          });
        }
      });
    });
    
    // Logout from admin
    cy.get('[data-testid="logout-button"]').click();
    
    // Login as customer
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(Cypress.env('customerEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('customerPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Navigate to the product
    cy.visit(`/products/${productId}`);
    
    // Add to cart
    cy.get('[data-testid="add-to-cart-button"]').click();
    
    // Complete checkout process
    // ... (similar to previous test)
    
    // Logout from customer account
    cy.get('[data-testid="logout-button"]').click();
    
    // Login as admin again
    cy.visit('/admin/login');
    cy.get('[data-testid="email-input"]').type(Cypress.env('adminEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('adminPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Navigate to the product
    cy.visit(`/admin/products/${productId}`);
    
    // Verify inventory is reduced
    cy.get('[data-testid="current-inventory"]').should(($el) => {
      const newInventory = parseInt($el.text());
      expect(newInventory).to.equal(initialInventory - 1);
    });
    
    // Verify inventory history shows the reduction
    cy.get('[data-testid="inventory-history"]').should('contain', 'Order');
    cy.get('[data-testid="inventory-history"]').should('contain', '-1');
  });

  it('should restore inventory when order is cancelled', () => {
    // Navigate to orders page
    cy.visit('/admin/orders');
    
    // Find a recent order
    cy.get('[data-testid="order-row"]').first().click();
    
    // Get product ID and quantity from order
    let productId;
    let orderQuantity;
    cy.get('[data-testid="order-item"]').first().within(() => {
      cy.get('[data-testid="item-product-id"]').then(($el) => {
        productId = $el.text();
      });
      cy.get('[data-testid="item-quantity"]').then(($el) => {
        orderQuantity = parseInt($el.text());
      });
    });
    
    // Get current inventory level
    cy.visit(`/admin/products/${productId}`);
    let initialInventory;
    cy.get('[data-testid="current-inventory"]').then(($el) => {
      initialInventory = parseInt($el.text());
    });
    
    // Go back to order and cancel it
    cy.go('back');
    cy.get('[data-testid="cancel-order-button"]').click();
    cy.get('[data-testid="cancel-reason"]').select('Customer request');
    cy.get('[data-testid="confirm-cancel-button"]').click();
    
    // Verify order status is updated
    cy.get('[data-testid="order-status"]').should('contain', 'Cancelled');
    
    // Check inventory is restored
    cy.visit(`/admin/products/${productId}`);
    cy.get('[data-testid="current-inventory"]').should(($el) => {
      const newInventory = parseInt($el.text());
      expect(newInventory).to.equal(initialInventory + orderQuantity);
    });
    
    // Verify inventory history shows the restoration
    cy.get('[data-testid="inventory-history"]').should('contain', 'Order cancelled');
    cy.get('[data-testid="inventory-history"]').should('contain', `+${orderQuantity}`);
  });
});