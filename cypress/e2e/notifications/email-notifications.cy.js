/**
 * End-to-End Test: Email Notifications
 * 
 * This test verifies that email notifications are sent correctly for various order events.
 * Note: This test requires a test email service or intercepting email requests.
 */

describe('Email Notifications', () => {
  beforeEach(() => {
    // Clear cookies and local storage between tests
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Intercept email API calls
    cy.intercept('POST', '**/api/send-email', (req) => {
      // Store the email request for later assertions
      req.alias = 'emailRequest';
      req.continue();
    }).as('emailRequest');
  });

  it('should send order confirmation email', () => {
    // Login as customer
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(Cypress.env('customerEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('customerPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Add product to cart
    cy.visit('/products');
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="add-to-cart-button"]').click();
    });
    
    // Complete checkout process
    cy.get('[data-testid="cart-icon"]').click();
    cy.get('[data-testid="checkout-button"]').click();
    
    // Fill shipping information
    cy.get('[data-testid="shipping-form"]').within(() => {
      // Only fill if fields are empty
      cy.get('[data-testid="address-line1"]').then(($input) => {
        if (!$input.val()) {
          cy.get('[data-testid="address-line1"]').type('123 Test Street');
          cy.get('[data-testid="city"]').type('Test City');
          cy.get('[data-testid="state"]').select('CA');
          cy.get('[data-testid="zip"]').type('90210');
        }
      });
      
      cy.get('[data-testid="continue-to-payment-button"]').click();
    });
    
    // Complete payment
    cy.get('[data-testid="payment-method-credit-card"]').click();
    cy.getStripeElement('cardNumber').type('4242424242424242');
    cy.getStripeElement('cardExpiry').type('1230');
    cy.getStripeElement('cardCvc').type('123');
    cy.get('[data-testid="place-order-button"]').click();
    
    // Verify order confirmation
    cy.url().should('include', '/checkout/thank-you');
    
    // Verify confirmation email was sent
    cy.wait('@emailRequest').then((interception) => {
      expect(interception.request.body).to.include({
        type: 'order_confirmation'
      });
      expect(interception.request.body.to).to.equal(Cypress.env('customerEmail'));
      expect(interception.response.statusCode).to.equal(200);
    });
  });

  it('should send order status update email', () => {
    // Login as admin
    cy.visit('/admin/login');
    cy.get('[data-testid="email-input"]').type(Cypress.env('adminEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('adminPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Navigate to orders page
    cy.visit('/admin/orders');
    
    // Click on first order in the list
    cy.get('[data-testid="order-row"]').first().click();
    
    // Update order status
    cy.get('[data-testid="status-dropdown"]').select('Shipped');
    cy.get('[data-testid="update-status-button"]').click();
    
    // Verify status update confirmation
    cy.get('[data-testid="status-updated-message"]').should('be.visible');
    
    // Verify status update email was sent
    cy.wait('@emailRequest').then((interception) => {
      expect(interception.request.body).to.include({
        type: 'order_status_update'
      });
      expect(interception.request.body.subject).to.include('Shipped');
      expect(interception.response.statusCode).to.equal(200);
    });
  });

  it('should send shipping confirmation with tracking info', () => {
    // Login as admin
    cy.visit('/admin/login');
    cy.get('[data-testid="email-input"]').type(Cypress.env('adminEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('adminPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Navigate to orders page
    cy.visit('/admin/orders');
    
    // Click on first order in the list
    cy.get('[data-testid="order-row"]').first().click();
    
    // Add tracking information
    cy.get('[data-testid="add-tracking-button"]').click();
    cy.get('[data-testid="tracking-carrier"]').select('UPS');
    cy.get('[data-testid="tracking-number"]').type('1Z999AA10123456784');
    cy.get('[data-testid="notify-customer"]').check();
    cy.get('[data-testid="save-tracking-button"]').click();
    
    // Verify tracking information is saved
    cy.get('[data-testid="tracking-info"]').should('contain', 'UPS');
    
    // Verify shipping confirmation email was sent
    cy.wait('@emailRequest').then((interception) => {
      expect(interception.request.body).to.include({
        type: 'shipping_confirmation'
      });
      expect(interception.request.body.content).to.include('1Z999AA10123456784');
      expect(interception.request.body.content).to.include('UPS');
      expect(interception.response.statusCode).to.equal(200);
    });
  });

  it('should send refund confirmation email', () => {
    // Login as admin
    cy.visit('/admin/login');
    cy.get('[data-testid="email-input"]').type(Cypress.env('adminEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('adminPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Navigate to orders page
    cy.visit('/admin/orders');
    
    // Find a completed order
    cy.get('[data-testid="status-filter"]').select('Completed');
    cy.get('[data-testid="filter-button"]').click();
    
    // Click on first completed order
    cy.get('[data-testid="order-row"]').first().click();
    
    // Process a refund
    cy.get('[data-testid="refund-button"]').click();
    cy.get('[data-testid="refund-type-partial"]').click();
    cy.get('[data-testid="refund-item-checkbox"]').first().check();
    cy.get('[data-testid="refund-reason"]').type('Customer request');
    cy.get('[data-testid="notify-customer"]').check();
    cy.get('[data-testid="process-refund-button"]').click();
    
    // Verify refund confirmation
    cy.get('[data-testid="refund-confirmation"]').should('be.visible');
    
    // Verify refund confirmation email was sent
    cy.wait('@emailRequest').then((interception) => {
      expect(interception.request.body).to.include({
        type: 'refund_confirmation'
      });
      expect(interception.request.body.subject).to.include('Refund');
      expect(interception.response.statusCode).to.equal(200);
    });
  });

  it('should send order cancellation email', () => {
    // Login as admin
    cy.visit('/admin/login');
    cy.get('[data-testid="email-input"]').type(Cypress.env('adminEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('adminPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Navigate to orders page
    cy.visit('/admin/orders');
    
    // Click on first order in the list
    cy.get('[data-testid="order-row"]').first().click();
    
    // Cancel the order
    cy.get('[data-testid="cancel-order-button"]').click();
    cy.get('[data-testid="cancel-reason"]').select('Customer request');
    cy.get('[data-testid="notify-customer"]').check();
    cy.get('[data-testid="confirm-cancel-button"]').click();
    
    // Verify order status is updated
    cy.get('[data-testid="order-status"]').should('contain', 'Cancelled');
    
    // Verify cancellation email was sent
    cy.wait('@emailRequest').then((interception) => {
      expect(interception.request.body).to.include({
        type: 'order_cancellation'
      });
      expect(interception.request.body.subject).to.include('Cancelled');
      expect(interception.response.statusCode).to.equal(200);
    });
  });

  it('should send low stock notification to admin', () => {
    // Login as admin
    cy.visit('/admin/login');
    cy.get('[data-testid="email-input"]').type(Cypress.env('adminEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('adminPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Navigate to products page
    cy.visit('/admin/products');
    
    // Click on first product in the list
    cy.get('[data-testid="product-row"]').first().click();
    
    // Navigate to inventory tab
    cy.get('[data-testid="inventory-tab"]').click();
    
    // Adjust inventory to low level
    cy.get('[data-testid="adjust-inventory-button"]').click();
    cy.get('[data-testid="adjustment-type"]').select('Set');
    cy.get('[data-testid="adjustment-quantity"]').type('3'); // Below threshold
    cy.get('[data-testid="adjustment-reason"]').select('Inventory correction');
    cy.get('[data-testid="save-adjustment-button"]').click();
    
    // Verify low stock notification was sent
    cy.wait('@emailRequest').then((interception) => {
      expect(interception.request.body).to.include({
        type: 'low_stock_alert'
      });
      expect(interception.request.body.to).to.include(Cypress.env('adminEmail'));
      expect(interception.response.statusCode).to.equal(200);
    });
  });
});

// Custom command for handling Stripe elements
Cypress.Commands.add('getStripeElement', (fieldName) => {
  return cy.get(`[data-testid="stripe-element-${fieldName}"] iframe`)
    .its('0.contentDocument.body')
    .should('not.be.empty')
    .then(body => cy.wrap(body))
    .find('.InputElement');
});