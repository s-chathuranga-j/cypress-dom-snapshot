describe.skip('Localhost DOM Snapshot Demo', () => {
  beforeEach(() => {
    // Visit the local test app
    cy.visit('http://localhost:3000');
  });

  it('should capture full DOM from localhost page', () => {
    // Verify page loaded
    cy.get('h1').should('contain', 'Test Application');

    // Capture initial state
    cy.captureSnapshot('initial-page-load');

    // Interact with form
    cy.get('#username').type('testuser123');
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('SecurePassword123!');
    cy.get('#comments').type('Testing the Cypress DOM Snapshot plugin with localhost');
    cy.get('#terms').check();

    // Capture filled form state
    cy.captureSnapshot('form-filled');

    // Submit form
    cy.get('#submitBtn').click();

    // Wait for success message
    cy.get('#successMessage.show').should('be.visible');

    // Capture success state
    cy.captureSnapshot('form-submitted-success');
  });

  it('should capture DOM on test failure (automatic)', () => {
    // Fill out form
    cy.get('#username').type('failtest');
    cy.get('#email').type('fail@test.com');

    // This will intentionally fail and trigger automatic snapshot capture
    cy.get('#nonexistent-element').should('exist');
  });

  it('should capture multiple snapshots in sequence', () => {
    // Test multiple snapshots in one test
    cy.captureSnapshot('step-1-initial');

    cy.get('#username').type('user1');
    cy.captureSnapshot('step-2-username-entered');

    cy.get('#email').type('user1@test.com');
    cy.captureSnapshot('step-3-email-entered');

    cy.get('#password').type('password123');
    cy.captureSnapshot('step-4-password-entered');

    cy.get('#comments').type('Multiple snapshot test');
    cy.captureSnapshot('step-5-all-fields-filled');
  });

  it('should verify snapshot contains actual page content', () => {
    // This test verifies the plugin captures real content, not Cypress iframe
    cy.get('.container').should('be.visible');
    cy.get('.feature-list').should('exist');
    cy.get('button[type="submit"]').should('contain', 'Submit Form');

    // Capture and verify later that snapshot has >50 elements
    cy.captureSnapshot('content-verification');
  });
});
