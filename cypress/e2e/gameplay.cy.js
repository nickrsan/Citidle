describe('Citidle E2E Gameplay', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads the game and shows initial HUD', () => {
    cy.get('#money-display').should('contain', '💰 $500');
    cy.get('#population-display').should('contain', '🏠 Pop: 0');
    cy.get('#btn-residential').should('be.visible');
    cy.get('#btn-commercial').should('not.have.class', 'locked');
    cy.get('#btn-industrial').should('not.have.class', 'locked');
  });

  it('allows placing a residential zone', () => {
    // Select residential zone
    cy.get('#btn-residential').click().should('have.class', 'active');
    
    // Click on the canvas to place a zone
    // We target the center of the canvas
    cy.get('#gameCanvas').click('center');
    
    // Check if money decreased (Residential costs 50)
    cy.get('#money-display').should('contain', '💰 $450');
    
    // Pop might still be 0 until a few ticks pass or it's updated
    // But we expect the toast to show success
    cy.get('.toast').should('contain', '✅ Placed residential zone');
  });

  it('can open and use the research panel', () => {
    cy.get('#btn-research').click();
    cy.get('#research-panel').should('be.visible');
    
    // Find Trade Agreements research
    // It should be clickable if we have enough money (starts with 500, cost is 200)
    cy.contains('.ri-name', 'Trade Agreements').parents('.research-item').click();
    
    // Check if it's researched (money should drop from 500 to 300)
    cy.get('#money-display').should('contain', '💰 $300');
    
    // Close research panel
    cy.get('#btn-close-research').click();
    cy.get('#research-panel').should('not.be.visible');
  });

  it('can expand the grid', () => {
    // Initial expand cost is 500
    cy.get('#btn-tiles').should('contain', '🗺 Expand ($500)');
    
    // Place something to spend money or just expand immediately if we have enough
    // We have 500 at start.
    cy.get('#btn-tiles').click();
    
    // Should show toast
    cy.get('.toast').should('contain', '🗺 Expanded to');
    
    // Money should be 0
    cy.get('#money-display').should('contain', '💰 $0');
    
    // Button should now show next cost (500 * 1.8 = 900)
    cy.get('#btn-tiles').should('contain', '($900)');
  });

  it('can toggle the help panel', () => {
    cy.get('#btn-help').click();
    cy.get('#help-panel').should('be.visible');
    cy.get('#btn-close-help').click();
    cy.get('#help-panel').should('not.be.visible');
  });
});
