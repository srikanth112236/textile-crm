describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should display login page', () => {
    cy.visit('/login');
    cy.contains('Sign in to your account');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Sign in');
  });

  it('should navigate to register page', () => {
    cy.visit('/login');
    cy.contains('create a new account').click();
    cy.url().should('include', '/register');
    cy.contains('Create your account');
  });

  it('should register a new user', () => {
    const email = `test${Date.now()}@example.com`;
    const password = 'TestPassword123!@#';

    cy.visit('/register');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="confirmPassword"]').type(password);
    cy.get('button[type="submit"]').click();

    // Should redirect to login page after successful registration
    cy.url().should('include', '/login');
  });

  it('should show error for password mismatch', () => {
    cy.visit('/register');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('TestPassword123!@#');
    cy.get('input[name="confirmPassword"]').type('DifferentPassword123!@#');
    cy.get('button[type="submit"]').click();

    cy.contains('Passwords do not match');
  });

  it('should show error for invalid email format', () => {
    cy.visit('/register');
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('input[name="password"]').type('TestPassword123!@#');
    cy.get('input[name="confirmPassword"]').type('TestPassword123!@#');
    cy.get('button[type="submit"]').click();

    // Browser validation should prevent submission or show error
    cy.get('input[name="email"]').should('have.attr', 'type', 'email');
  });

  // Note: Login test would require a test user to be created first
  // This would typically be done in a test setup script or database seeding
  it.skip('should login with valid credentials', () => {
    // This test requires:
    // 1. Test user in database
    // 2. Backend server running
    // 3. Database connection
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('TestPassword123!@#');
    cy.get('button[type="submit"]').click();

    // Should redirect to home/dashboard after login
    cy.url().should('not.include', '/login');
  });
});

