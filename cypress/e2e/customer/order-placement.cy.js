/**
 * End-to-End Test: Customer Order Placement
 * 
 * This test verifies that a customer can successfully place an order
 * for in-stock items through the checkout process.
 */

describe('Customer Order Placement', () => {
  beforeEach(() => {
    // Clear cookies and local storage between tests
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should allow a logged-in customer to place an order', () => {
    // Login as customer
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(Cypress.env('customerEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('customerPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Verify successful login
    cy.url().should('include', '/account');
    
    // Navigate to products page
    cy.visit('/products');
    
    // Add a product to cart
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="add-to-cart-button"]').click();
    });
    
    // Verify product added to cart
    cy.get('[data-testid="cart-count"]').should('contain', '1');
    
    // Go to cart
    cy.get('[data-testid="cart-icon"]').click();
    
    // Proceed to checkout
    cy.get('[data-testid="checkout-button"]').click();
    
    // Verify checkout page loaded
    cy.url().should('include', '/checkout');
    
    // Fill shipping information (if not pre-filled from account)
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
    
    // Select payment method
    cy.get('[data-testid="payment-form"]').within(() => {
      // Select credit card payment
      cy.get('[data-testid="payment-method-credit-card"]').click();
      
      // Fill test credit card details in Stripe iframe
      // Note: This is a simplified example. Actual Stripe iframe handling may require more complex code
      cy.getStripeElement('cardNumber').type('4242424242424242');
      cy.getStripeElement('cardExpiry').type('1230');
      cy.getStripeElement('cardCvc').type('123');
      
      // Complete order
      cy.get('[data-testid="place-order-button"]').click();
    });
    
    // Verify order confirmation
    cy.url().should('include', '/checkout/thank-you');
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
    cy.get('[data-testid="order-number"]').should('exist');
    
    // Verify order appears in customer's order history
    cy.visit('/account/orders');
    cy.get('[data-testid="order-list"]').should('contain', 'Processing');
  });

  it('should allow a guest to place an order', () => {
    // Navigate to products page
    cy.visit('/products');
    
    // Add a product to cart
    cy.get('[data-testid="product-card"]').first().within(() => {
      cy.get('[data-testid="add-to-cart-button"]').click();
    });
    
    // Go to cart
    cy.get('[data-testid="cart-icon"]').click();
    
    // Proceed to checkout
    cy.get('[data-testid="checkout-button"]').click();
    
    // Verify checkout page loaded
    cy.url().should('include', '/checkout');
    
    // Fill contact information
    cy.get('[data-testid="contact-form"]').within(() => {
      cy.get('[data-testid="email"]').type('guest@example.com');
      cy.get('[data-testid="continue-as-guest"]').click();
    });
    
    // Fill shipping information
    cy.get('[data-testid="shipping-form"]').within(() => {
      cy.get('[data-testid="first-name"]').type('Guest');
      cy.get('[data-testid="last-name"]').type('User');
      cy.get('[data-testid="address-line1"]').type('456 Guest Street');
      cy.get('[data-testid="city"]').type('Guest City');
      cy.get('[data-testid="state"]').select('NY');
      cy.get('[data-testid="zip"]').type('10001');
      cy.get('[data-testid="phone"]').type('5551234567');
      
      cy.get('[data-testid="continue-to-payment-button"]').click();
    });
    
    // Select payment method
    cy.get('[data-testid="payment-form"]').within(() => {
      // Select credit card payment
      cy.get('[data-testid="payment-method-credit-card"]').click();
      
      // Fill test credit card details in Stripe iframe
      cy.getStripeElement('cardNumber').type('4242424242424242');
      cy.getStripeElement('cardExpiry').type('1230');
      cy.getStripeElement('cardCvc').type('123');
      
      // Complete order
      cy.get('[data-testid="place-order-button"]').click();
    });
    
    // Verify order confirmation
    cy.url().should('include', '/checkout/thank-you');
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
    cy.get('[data-testid="order-number"]').should('exist');
  });

  it('should handle out-of-stock products correctly', () => {
    // Login as customer
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(Cypress.env('customerEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('customerPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Navigate to out-of-stock product
    cy.visit('/products/prod_outofstock_001');
    
    // Verify out-of-stock message is displayed
    cy.get('[data-testid="out-of-stock-message"]').should('be.visible');
    
    // Verify add to cart button is disabled
    cy.get('[data-testid="add-to-cart-button"]').should('be.disabled');
  });

  it('should handle backorderable products correctly', () => {
    // Login as customer
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(Cypress.env('customerEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('customerPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Navigate to backorderable product
    cy.visit('/products/prod_backorder_001');
    
    // Verify backorder message is displayed
    cy.get('[data-testid="backorder-message"]').should('be.visible');
    
    // Add product to cart
    cy.get('[data-testid="add-to-cart-button"]').click();
    
    // Go to cart
    cy.get('[data-testid="cart-icon"]').click();
    
    // Verify backorder warning in cart
    cy.get('[data-testid="backorder-warning"]').should('be.visible');
    
    // Proceed to checkout
    cy.get('[data-testid="checkout-button"]').click();
    
    // Complete checkout process
    // ... (similar to previous test)
    
    // Verify backorder information on confirmation page
    cy.url().should('include', '/checkout/thank-you');
    cy.get('[data-testid="backorder-info"]').should('be.visible');
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