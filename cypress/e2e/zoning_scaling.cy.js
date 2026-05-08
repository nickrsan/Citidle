describe('Zoning Scaling Costs', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('displays the initial placement cost on zone buttons', () => {
    cy.get('#btn-residential').should('contain', '🏠 Residential ($50)');
    cy.get('#btn-commercial').should('contain', '🏪 Commercial ($75)');
    cy.get('#btn-industrial').should('contain', '🏭 Industrial ($100)');
  });

  it('increases the cost after placing a zone', () => {
    // Select residential zone
    cy.get('#btn-residential').click();
    
    // Place a zone
    cy.get('#gameCanvas').click('center');
    
    // Cost should increase. Initial 50, scale 2 -> 50 * 2 = 100
    // Wait for the UI to update
    cy.get('#btn-residential').should('contain', '🏠 Residential ($100)');
  });

  it('respects research cost reduction', () => {
    // Open research panel
    cy.get('#btn-research').click();
    
    // Find "Community Meeting Facilitation" which reduces cost by 10%
    cy.contains('.ri-name', 'Community Meeting Facilitation').parents('.research-item').click();
    
    // Close research panel
    cy.get('#btn-close-research').click();
    
    // Cost should be reduced. Residential 50 * 0.9 = 45
    cy.get('#btn-residential').should('contain', '🏠 Residential ($45)');
  });
});
