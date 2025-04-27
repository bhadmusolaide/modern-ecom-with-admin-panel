describe('Checkout Process', () => {
  beforeEach(() => {
    // Reset any application state
    cy.window().then((win) => {
      win.localStorage.removeItem('cart');
    });

    // Visit the home page
    cy.visit('/');
  });

  it('should allow adding products to cart', () => {
    // Navigate to shop page
    cy.get('a[href*="/shop"]').first().click();

    // Wait for products to load
    cy.get('[data-testid="product-card"]').should('be.visible');

    // Click on the first product
    cy.get('[data-testid="product-card"]').first().click();

    // Wait for product detail page to load
    cy.get('[data-testid="product-detail"]').should('be.visible');

    // Add product to cart
    cy.get('[data-testid="add-to-cart-button"]').click();

    // Verify toast notification
    cy.get('[data-testid="toast"]').should('be.visible');
    cy.get('[data-testid="toast"]').should('contain', 'Added');

    // Verify cart count updated
    cy.get('[data-testid="cart-count"]').should('not.have.text', '0');
  });

  it('should navigate through checkout process', () => {
    // Add a product to cart first
    cy.visit('/shop');
    cy.get('[data-testid="product-card"]').first().click();
    cy.get('[data-testid="add-to-cart-button"]').click();

    // Go to cart
    cy.get('[data-testid="cart-icon"]').click();

    // Verify product is in cart
    cy.get('[data-testid="cart-item"]').should('have.length.at.least', 1);

    // Proceed to checkout
    cy.get('[data-testid="checkout-button"]').click();

    // Verify we're on checkout page
    cy.url().should('include', '/checkout');

    // Fill out checkout form
    cy.get('#firstName').type('Test');
    cy.get('#lastName').type('User');
    cy.get('#email').type('test@example.com');
    cy.get('#address').type('123 Test St');
    cy.get('#city').type('Test City');
    cy.get('#postalCode').type('12345');

    // Select country
    cy.get('#country').select('US');

    // Select payment method
    cy.get('#credit-card').check();

    // Check for inventory warnings
    cy.get('[data-testid="inventory-warning"]').then(($warning) => {
      if ($warning.length > 0) {
        // If there are inventory warnings, handle them
        cy.get('[data-testid="accept-backorders"]').check();
      }
    });

    // Submit order
    cy.get('button[type="submit"]').click();

    // Verify redirect to thank you page
    cy.url().should('include', '/checkout/thank-you');
    cy.get('h1').should('contain', 'Thank You');

    // Verify order details are displayed
    cy.get('[data-testid="order-number"]').should('be.visible');
  });

  it('should handle out-of-stock products correctly', () => {
    // Visit a product that we know is out of stock
    // For testing purposes, we'll use a specific product ID
    cy.visit('/product/prod_outofstock_001');

    // Verify out of stock message is displayed
    cy.get('[data-testid="out-of-stock-message"]').should('be.visible');

    // Verify add to cart button is disabled
    cy.get('[data-testid="add-to-cart-button"]').should('be.disabled');
  });

  it('should handle backorderable products correctly', () => {
    // Visit a product that we know is backorderable
    cy.visit('/product/prod_backorder_001');

    // Verify backorder message is displayed
    cy.get('[data-testid="backorder-message"]').should('be.visible');

    // Add to cart should still be enabled
    cy.get('[data-testid="add-to-cart-button"]').should('not.be.disabled');

    // Add to cart
    cy.get('[data-testid="add-to-cart-button"]').click();

    // Go to checkout
    cy.get('[data-testid="cart-icon"]').click();
    cy.get('[data-testid="checkout-button"]').click();

    // Verify backorder warning is displayed in checkout
    cy.get('[data-testid="backorder-warning"]').should('be.visible');

    // Accept backorders
    cy.get('[data-testid="accept-backorders"]').check();

    // Fill out checkout form
    cy.get('#firstName').type('Test');
    cy.get('#lastName').type('User');
    cy.get('#email').type('test@example.com');
    cy.get('#address').type('123 Test St');
    cy.get('#city').type('Test City');
    cy.get('#postalCode').type('12345');
    cy.get('#country').select('US');
    cy.get('#credit-card').check();

    // Submit order
    cy.get('button[type="submit"]').click();

    // Verify redirect to thank you page
    cy.url().should('include', '/checkout/thank-you');

    // Verify backorder information is displayed
    cy.get('[data-testid="backorder-info"]').should('be.visible');
  });

  it('should validate required fields in checkout form', () => {
    // Add a product to cart first
    cy.visit('/shop');
    cy.get('[data-testid="product-card"]').first().click();
    cy.get('[data-testid="add-to-cart-button"]').click();

    // Go to checkout
    cy.get('[data-testid="cart-icon"]').click();
    cy.get('[data-testid="checkout-button"]').click();

    // Submit form without filling required fields
    cy.get('button[type="submit"]').click();

    // Verify validation errors
    cy.get('[data-testid="form-error"]').should('be.visible');

    // Fill only some fields
    cy.get('#firstName').type('Test');
    cy.get('#email').type('test@example.com');

    // Submit again
    cy.get('button[type="submit"]').click();

    // Verify validation errors still present
    cy.get('[data-testid="form-error"]').should('be.visible');
  });

  it('should allow guest users to look up their order', () => {
    // First place an order as guest
    cy.visit('/shop');
    cy.get('[data-testid="product-card"]').first().click();
    cy.get('[data-testid="add-to-cart-button"]').click();
    cy.get('[data-testid="cart-icon"]').click();
    cy.get('[data-testid="checkout-button"]').click();

    // Fill out checkout form
    cy.get('#firstName').type('Guest');
    cy.get('#lastName').type('User');
    cy.get('#email').type('guest@example.com');
    cy.get('#address').type('123 Guest St');
    cy.get('#city').type('Guest City');
    cy.get('#postalCode').type('12345');
    cy.get('#country').select('US');
    cy.get('#credit-card').check();

    // Submit order
    cy.get('button[type="submit"]').click();

    // Get order number from thank you page
    cy.get('[data-testid="order-number"]').invoke('text').as('orderNumber');

    // Now try to look up the order
    cy.visit('/order-lookup');

    cy.get('@orderNumber').then((orderNumber) => {
      cy.get('#orderNumber').type(orderNumber.toString());
    });

    cy.get('#email').type('guest@example.com');
    cy.get('button[type="submit"]').click();

    // Verify order details are displayed
    cy.get('[data-testid="order-details"]').should('be.visible');
  });
});

describe('Admin Order Management', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/admin/login');
    cy.get('#email').type('admin@yours-ecom.com');
    cy.get('#password').type('admin-password');
    cy.get('button[type="submit"]').click();

    // Verify admin dashboard is loaded
    cy.url().should('include', '/admin');
  });

  it('should display list of orders', () => {
    // Navigate to orders page
    cy.get('a[href*="/admin/orders"]').click();

    // Verify orders table is displayed
    cy.get('[data-testid="orders-table"]').should('be.visible');

    // Verify orders are loaded
    cy.get('[data-testid="order-row"]').should('have.length.at.least', 1);
  });

  it('should allow viewing order details', () => {
    // Navigate to orders page
    cy.get('a[href*="/admin/orders"]').click();

    // Click on first order
    cy.get('[data-testid="order-row"]').first().click();

    // Verify order details page is loaded
    cy.get('[data-testid="order-details"]').should('be.visible');

    // Verify customer information is displayed
    cy.get('[data-testid="customer-info"]').should('be.visible');

    // Verify order items are displayed
    cy.get('[data-testid="order-items"]').should('be.visible');
  });

  it('should allow updating order status', () => {
    // Navigate to orders page
    cy.get('a[href*="/admin/orders"]').click();

    // Click on first order
    cy.get('[data-testid="order-row"]').first().click();

    // Change order status
    cy.get('[data-testid="status-select"]').click();
    cy.get('[data-value="processing"]').click();

    // Save changes
    cy.get('[data-testid="save-status"]').click();

    // Verify success message
    cy.get('[data-testid="toast"]').should('contain', 'updated');

    // Verify status was updated
    cy.get('[data-testid="current-status"]').should('contain', 'Processing');
  });

  it('should allow processing refunds', () => {
    // Navigate to orders page
    cy.get('a[href*="/admin/orders"]').click();

    // Find an order with "delivered" status
    cy.get('[data-testid="order-row"]').contains('Delivered').first().click();

    // Open refund panel
    cy.get('[data-testid="refund-button"]').click();

    // Select full refund
    cy.get('[data-testid="full-refund"]').check();

    // Enter refund reason
    cy.get('#refundReason').type('Customer requested refund');

    // Process refund
    cy.get('[data-testid="process-refund"]').click();

    // Verify success message
    cy.get('[data-testid="toast"]').should('contain', 'refunded');

    // Verify order status updated
    cy.get('[data-testid="current-status"]').should('contain', 'Refunded');
  });
});

describe('Inventory Management', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('/admin/login');
    cy.get('#email').type('admin@yours-ecom.com');
    cy.get('#password').type('admin-password');
    cy.get('button[type="submit"]').click();
  });

  it('should display product inventory information', () => {
    // Navigate to products page
    cy.get('a[href*="/admin/products"]').click();

    // Click on first product
    cy.get('[data-testid="product-row"]').first().click();

    // Go to inventory tab
    cy.get('[data-testid="inventory-tab"]').click();

    // Verify inventory panel is displayed
    cy.get('[data-testid="inventory-panel"]').should('be.visible');

    // Verify current stock is displayed
    cy.get('[data-testid="current-stock"]').should('be.visible');
  });

  it('should allow adjusting product stock', () => {
    // Navigate to products page
    cy.get('a[href*="/admin/products"]').click();

    // Click on first product
    cy.get('[data-testid="product-row"]').first().click();

    // Go to inventory tab
    cy.get('[data-testid="inventory-tab"]').click();

    // Get current stock value
    cy.get('[data-testid="current-stock"]').invoke('text').as('initialStock');

    // Click adjust stock button
    cy.get('[data-testid="adjust-stock"]').click();

    // Enter stock adjustment
    cy.get('#stockChange').clear().type('5');

    // Select reason
    cy.get('#adjustmentReason').select('Restock');

    // Submit adjustment
    cy.get('[data-testid="submit-adjustment"]').click();

    // Verify success message
    cy.get('[data-testid="toast"]').should('contain', 'updated');

    // Verify stock was updated
    cy.get('@initialStock').then((initialStock) => {
      const newStock = parseInt(initialStock.toString()) + 5;
      cy.get('[data-testid="current-stock"]').should('contain', newStock);
    });
  });

  it('should display inventory history', () => {
    // Navigate to products page
    cy.get('a[href*="/admin/products"]').click();

    // Click on first product
    cy.get('[data-testid="product-row"]').first().click();

    // Go to inventory tab
    cy.get('[data-testid="inventory-tab"]').click();

    // Go to history tab
    cy.get('[data-testid="history-tab"]').click();

    // Verify history table is displayed
    cy.get('[data-testid="history-table"]').should('be.visible');

    // Verify history entries are loaded
    cy.get('[data-testid="history-entry"]').should('have.length.at.least', 1);
  });

  it('should allow updating inventory settings', () => {
    // Navigate to products page
    cy.get('a[href*="/admin/products"]').click();

    // Click on first product
    cy.get('[data-testid="product-row"]').first().click();

    // Go to inventory tab
    cy.get('[data-testid="inventory-tab"]').click();

    // Go to settings tab
    cy.get('[data-testid="settings-tab"]').click();

    // Click edit settings
    cy.get('[data-testid="edit-settings"]').click();

    // Toggle track inventory
    cy.get('#trackInventory').click();

    // Set low stock threshold
    cy.get('#lowStockThreshold').clear().type('10');

    // Toggle backorders
    cy.get('#backorderEnabled').click();

    // Save settings
    cy.get('[data-testid="save-settings"]').click();

    // Verify success message
    cy.get('[data-testid="toast"]').should('contain', 'updated');

    // Verify settings were updated
    cy.get('[data-testid="track-inventory-status"]').should('contain', 'Enabled');
    cy.get('[data-testid="low-stock-threshold"]').should('contain', '10');
    cy.get('[data-testid="backorder-status"]').should('contain', 'Enabled');
  });
});