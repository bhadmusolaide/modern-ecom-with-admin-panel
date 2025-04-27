/**
 * End-to-End Test: Payment Processing
 * 
 * This test verifies that payment processing works correctly,
 * including credit card payments, PayPal, and handling payment failures.
 */

describe('Payment Processing', () => {
  beforeEach(() => {
    // Clear cookies and local storage between tests
    cy.clearCookies();
    cy.clearLocalStorage();
    
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
    
    // Go to cart
    cy.get('[data-testid="cart-icon"]').click();
    
    // Proceed to checkout
    cy.get('[data-testid="checkout-button"]').click();
    
    // Complete shipping information
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
  });

  it('should process credit card payment successfully', () => {
    // Select credit card payment
    cy.get('[data-testid="payment-method-credit-card"]').click();
    
    // Fill test credit card details in Stripe iframe
    cy.getStripeElement('cardNumber').type('4242424242424242');
    cy.getStripeElement('cardExpiry').type('1230');
    cy.getStripeElement('cardCvc').type('123');
    
    // Complete order
    cy.get('[data-testid="place-order-button"]').click();
    
    // Verify order confirmation
    cy.url().should('include', '/checkout/thank-you');
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
    cy.get('[data-testid="payment-status"]').should('contain', 'Paid');
  });

  it('should process PayPal payment successfully', () => {
    // Select PayPal payment
    cy.get('[data-testid="payment-method-paypal"]').click();
    
    // Click PayPal button
    cy.get('[data-testid="paypal-button"]').click();
    
    // Mock PayPal authentication flow
    // Note: This is a simplified example. Actual PayPal flow would require more complex handling
    cy.window().then((win) => {
      // Simulate PayPal callback
      win.paypalCallback({
        status: 'COMPLETED',
        orderID: 'TEST12345',
        payerID: 'TESTPAYER123'
      });
    });
    
    // Verify order confirmation
    cy.url().should('include', '/checkout/thank-you');
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
    cy.get('[data-testid="payment-status"]').should('contain', 'Paid');
    cy.get('[data-testid="payment-method"]').should('contain', 'PayPal');
  });

  it('should handle declined credit card gracefully', () => {
    // Select credit card payment
    cy.get('[data-testid="payment-method-credit-card"]').click();
    
    // Fill test credit card details for declined card
    cy.getStripeElement('cardNumber').type('4000000000000002'); // Declined card
    cy.getStripeElement('cardExpiry').type('1230');
    cy.getStripeElement('cardCvc').type('123');
    
    // Attempt to complete order
    cy.get('[data-testid="place-order-button"]').click();
    
    // Verify error message
    cy.get('[data-testid="payment-error"]').should('be.visible');
    cy.get('[data-testid="payment-error"]').should('contain', 'Your card was declined');
    
    // Verify we're still on checkout page
    cy.url().should('include', '/checkout');
    cy.url().should('not.include', '/thank-you');
  });

  it('should handle insufficient funds gracefully', () => {
    // Select credit card payment
    cy.get('[data-testid="payment-method-credit-card"]').click();
    
    // Fill test credit card details for insufficient funds
    cy.getStripeElement('cardNumber').type('4000000000009995'); // Insufficient funds card
    cy.getStripeElement('cardExpiry').type('1230');
    cy.getStripeElement('cardCvc').type('123');
    
    // Attempt to complete order
    cy.get('[data-testid="place-order-button"]').click();
    
    // Verify error message
    cy.get('[data-testid="payment-error"]').should('be.visible');
    cy.get('[data-testid="payment-error"]').should('contain', 'insufficient funds');
    
    // Verify we're still on checkout page
    cy.url().should('include', '/checkout');
    cy.url().should('not.include', '/thank-you');
  });

  it('should save payment method for future use', () => {
    // Select credit card payment
    cy.get('[data-testid="payment-method-credit-card"]').click();
    
    // Fill test credit card details
    cy.getStripeElement('cardNumber').type('4242424242424242');
    cy.getStripeElement('cardExpiry').type('1230');
    cy.getStripeElement('cardCvc').type('123');
    
    // Check save payment method
    cy.get('[data-testid="save-payment-method"]').check();
    
    // Complete order
    cy.get('[data-testid="place-order-button"]').click();
    
    // Verify order confirmation
    cy.url().should('include', '/checkout/thank-you');
    
    // Start a new order
    cy.visit('/products');
    cy.get('[data-testid="product-card"]').eq(1).within(() => {
      cy.get('[data-testid="add-to-cart-button"]').click();
    });
    cy.get('[data-testid="cart-icon"]').click();
    cy.get('[data-testid="checkout-button"]').click();
    
    // Complete shipping information
    cy.get('[data-testid="shipping-form"]').within(() => {
      cy.get('[data-testid="continue-to-payment-button"]').click();
    });
    
    // Verify saved payment method is available
    cy.get('[data-testid="saved-payment-methods"]').should('be.visible');
    cy.get('[data-testid="saved-payment-method"]').should('contain', '•••• 4242');
    
    // Select saved payment method
    cy.get('[data-testid="saved-payment-method"]').click();
    
    // Complete order
    cy.get('[data-testid="place-order-button"]').click();
    
    // Verify order confirmation
    cy.url().should('include', '/checkout/thank-you');
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
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