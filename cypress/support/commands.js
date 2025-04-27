// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
});

Cypress.Commands.add('adminLogin', (email, password) => {
  cy.visit('/admin/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
});

// Custom command for handling Stripe elements
Cypress.Commands.add('getStripeElement', (fieldName) => {
  return cy.get(`[data-testid="stripe-element-${fieldName}"] iframe`)
    .its('0.contentDocument.body')
    .should('not.be.empty')
    .then(body => cy.wrap(body))
    .find('.InputElement');
});

// Command to add a product to cart
Cypress.Commands.add('addToCart', (productId) => {
  if (productId) {
    cy.visit(`/products/${productId}`);
  } else {
    cy.visit('/products');
    cy.get('[data-testid="product-card"]').first().click();
  }
  cy.get('[data-testid="add-to-cart-button"]').click();
});

// Command to complete checkout process
Cypress.Commands.add('completeCheckout', (paymentMethod = 'credit-card') => {
  // Go to cart
  cy.get('[data-testid="cart-icon"]').click();
  
  // Proceed to checkout
  cy.get('[data-testid="checkout-button"]').click();
  
  // Fill shipping information if needed
  cy.get('[data-testid="shipping-form"]').within(() => {
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
  
  // Select payment method and complete payment
  if (paymentMethod === 'credit-card') {
    cy.get('[data-testid="payment-method-credit-card"]').click();
    cy.getStripeElement('cardNumber').type('4242424242424242');
    cy.getStripeElement('cardExpiry').type('1230');
    cy.getStripeElement('cardCvc').type('123');
  } else if (paymentMethod === 'paypal') {
    cy.get('[data-testid="payment-method-paypal"]').click();
    cy.get('[data-testid="paypal-button"]').click();
    
    // Mock PayPal authentication flow
    cy.window().then((win) => {
      win.paypalCallback({
        status: 'COMPLETED',
        orderID: 'TEST12345',
        payerID: 'TESTPAYER123'
      });
    });
  }
  
  // Complete order
  cy.get('[data-testid="place-order-button"]').click();
  
  // Verify order confirmation
  cy.url().should('include', '/checkout/thank-you');
});