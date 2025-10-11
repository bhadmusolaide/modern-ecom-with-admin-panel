describe('Shop page interactions', () => {
  before(() => {
    // Seed products for deterministic tests
    cy.exec('npm run firebase:test-seed-products', { timeout: 120000 });
  });

  after(() => {
    // Cleanup seeded products
    cy.exec('npm run firebase:test-clear-products', { timeout: 120000 });
  });

  beforeEach(() => {
    // Start from shop page fresh each test
    cy.visit('/shop');
  });

  it('navigates when clicking a product link', function () {
    cy.get('[data-cy="product-link"]').should('exist');
    cy.get('[data-cy="product-link"]').first().invoke('attr', 'href').then((href) => {
      expect(href).to.match(/\/shop\/product\//);
      cy.get('[data-cy="product-link"]').first().click();
      cy.location('pathname', { timeout: 10000 }).should('eq', href);
    });
  });

  it('adds to cart without navigating when clicking Quick Add', function () {
    cy.location('pathname').should('eq', '/shop');
    cy.get('[data-cy="quick-add"]').should('exist');
    cy.get('[data-cy="quick-add"]').first().click();
    cy.location('pathname').should('eq', '/shop');
    cy.contains('Added', { timeout: 10000 }).should('be.visible');
  });

  it('toggles wishlist without navigating and reflects active state', function () {
    cy.location('pathname').should('eq', '/shop');
    cy.get('[data-cy="wishlist-btn"]').should('exist');

    cy.get('[data-cy="wishlist-btn"]').first()
      .as('wishBtn')
      .click();

    cy.location('pathname').should('eq', '/shop');
    cy.get('@wishBtn').should('have.attr', 'aria-pressed', 'true');
    cy.contains('Added to wishlist', { timeout: 10000 }).should('be.visible');

    cy.get('@wishBtn').click();
    cy.get('@wishBtn').should('have.attr', 'aria-pressed', 'false');
    cy.contains('Removed from wishlist', { timeout: 10000 }).should('be.visible');
  });
});

