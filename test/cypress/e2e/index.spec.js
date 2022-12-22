import 'cypress-wait-until';

describe('Test SDK Usage from within a browser', function() {
    this.timeout(180000);

    it('Creates an account', function() {
        cy.visit('http://localhost:9090');
        cy.waitUntil(() => cy.get('body').should('have.text', 'SUCCESS'));
    }).timeout(180000);
});
