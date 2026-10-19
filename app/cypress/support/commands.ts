/// <reference types="cypress" />

// Custom command for login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Custom command for logout
Cypress.Commands.add('logout', () => {
  // Implementation depends on your logout mechanism
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.visit('/login');
});

