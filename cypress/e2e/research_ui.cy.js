describe('Research UI Improvements', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('#btn-research').click();
  });

  it('shows progress bars for multi-level items', () => {
    // Urban Sprawl (spread_rate) has 10 levels
    cy.contains('.ri-name', 'Urban Sprawl')
      .parents('.research-item')
      .find('.ri-progress-container')
      .should('be.visible');
  });

  it('shows prerequisite text for locked items', () => {
    // High Rise Housing requires Residential Density Level 2
    cy.contains('.ri-name', 'High Rise Housing')
      .parents('.research-item')
      .should('have.class', 'locked')
      .find('.ri-requires')
      .should('contain', 'Requires Residential Density Level 2');
  });

  it('fades out items when money is insufficient', () => {
    // Initial money 500.
    // Spend it all on expanding the grid (costs 500).
    cy.get('#btn-close-research').click();
    cy.get('#btn-tiles').click();
    cy.get('#money-display').should('contain', '💰 $0');
    
    cy.get('#btn-research').click();
    
    // Urban Sprawl cost 80, should be unaffordable
    cy.contains('.ri-name', 'Urban Sprawl')
      .parents('.research-item')
      .should('have.class', 'unaffordable');
  });

  it('updates progress bar after purchase', () => {
    // Urban Sprawl
    cy.contains('.ri-name', 'Urban Sprawl')
      .parents('.research-item')
      .as('item');
    
    cy.get('@item').find('.ri-progress-fill')
      .should('have.attr', 'style')
      .and('contain', 'width: 0%');
    
    cy.get('@item').click();
    
    cy.get('@item').find('.ri-progress-fill')
      .should('have.attr', 'style')
      .and('contain', 'width: 10%'); // 1/10 * 100
  });
});
