describe.skip('DOM Snapshot Demo', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should capture snapshot on test failure', () => {
    cy.get('h1').should('be.visible');
    cy.get('a').first().click();

    cy.get('.nonexistent-element').should('exist');
  });

  it('should allow manual snapshots', () => {
    cy.get('h1').should('be.visible');

    cy.captureSnapshot('before-navigation');

    cy.get('a').first().click();

    cy.captureSnapshot('after-navigation');
  });

  it('should pass without capturing', () => {
    cy.get('h1').should('be.visible');
    cy.get('a').should('have.length.greaterThan', 0);
  });

  it('another failing test with form', () => {
    cy.visit('/commands/actions');

    cy.get('.action-email')
      .type('fake@email.com')
      .should('have.value', 'fake@email.com');

    cy.get('.nonexistent-submit-button').click();
  });
});
