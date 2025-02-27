describe('FinWise Application Tests', () => {
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
      cy.visit(baseUrl);
  });

  context('Sign In Page', () => {
      it('Should display the Sign In page', () => {
          cy.contains('Sign In');
          cy.get('input[type="email"]').should('exist');
          cy.get('input[type="password"]').should('exist');
          cy.get('button').contains('Sign In');
      });

      it('Should show error message on incorrect login', () => {
          cy.get('input[type="email"]').type('test@example.com');
          cy.get('input[type="password"]').type('wrongpassword');
          cy.get('button').contains('Sign In').click();
          cy.contains('Incorrect Password');
      });

  });

  context('Sign Up Page', () => {
      beforeEach(() => {
          cy.visit(`${baseUrl}/signup`);
      });

      it('Should display the Sign Up page', () => {
          cy.contains('Sign Up');
          cy.get('input[type="email"]').should('exist');
          cy.get('input[type="password"]').should('exist');
          cy.get('input[placeholder="Confirm Password"]').should('exist');
          cy.get('button').contains('Sign Up');
      });

  });

  context('Main Dashboard', () => {
      beforeEach(() => {
          cy.visit(`${baseUrl}/signin`);
          cy.get('input[type="email"]').type('sricharan.kathika30@gmail.com');
          cy.get('input[type="password"]').type('Kobejordan@4');
          cy.get('button').contains('Sign In').click();
          cy.url().should('include', '/main');
      });

      it('Should add a transaction', () => {
          cy.contains('Add a Transaction').click();
          cy.get('input[placeholder="Amount"]').type('50');
          cy.get('select').select('Food');
          cy.get('input[placeholder="Description"]').type('Lunch');
          cy.get('input[type="date"]').type('2025-02-27');
          cy.get('button').contains('Add Transaction').click();
          cy.contains('Lunch');
      });

      it('Should delete a transaction', () => {
          cy.contains('Transactions').click();
          cy.contains('Lunch').parent().find('.delete-btn').click();
          cy.contains('Lunch').should('not.exist');
      });

      it('Should add a budget', () => {
          cy.contains('Budgets').click();
          cy.contains('Food').click();
          cy.get('input[placeholder="Budget Amount"]').type('500');
          cy.get('input[type="month"]').type('2025-03');
          cy.get('button').contains('Add Budget').click();
          cy.contains('$500.00');
      });

      it('Should delete a budget', () => {
          cy.contains('Budgets').click();
          cy.contains('Food').click();
          cy.get('.delete-btn').first().click();
          cy.contains('$500.00').should('not.exist');
      });

      it('Should generate a financial report', () => {
          cy.contains('Financial Report').click();
          cy.get('input[type="date"]').first().type('2025-01-01');
          cy.get('input[type="date"]').last().type('2025-02-27');
          cy.get('button').contains('Generate Report').click();
          cy.contains('Report Summary');
      });

      it('Should logout successfully', () => {
          cy.get('.logout-button').click();
          cy.url().should('include', '/signin');
      });
  });
});
