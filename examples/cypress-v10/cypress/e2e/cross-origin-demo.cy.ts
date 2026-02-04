describe.only('Cross-Origin DOM Snapshot Demo', () => {
  it('should capture snapshot from cross-origin page', () => {
    // Visit a cross-origin website
    cy.visit('https://www.saucedemo.com');

    // Interact with the page
    cy.get('#user-name').type('standard_user');
    cy.get('#password').type('secret_sauce');

    // Submit the form
    cy.get('#login-buttons').click();

    // Wait for navigation
    cy.url().should('include', '/inventory.html');

    // Capture snapshot of the inventory pag
  });
});
