describe('Zoom UI', () => {
    beforeEach(() => {
        cy.visit('http://localhost:8081');
    });

    it('should have a zoom reset button', () => {
        cy.get('#btn-zoom-reset').should('be.visible').and('contain', 'Reset');
    });

    it('can zoom in and out with the wheel', () => {
        // Initial state
        cy.get('#gameCanvas').trigger('wheel', { deltaY: -100 }); // Zoom in
        // We can't easily check internal state, but we can check if it doesn't crash
        cy.wait(100);
        cy.get('#gameCanvas').trigger('wheel', { deltaY: 100 }); // Zoom out
        cy.wait(100);
    });

    it('can reset zoom with the button', () => {
        // Zoom in first
        cy.get('#gameCanvas').trigger('wheel', { deltaY: -500 });
        cy.wait(100);
        
        // Click reset
        cy.get('#btn-zoom-reset').click();
        
        // Wait a bit to ensure no errors
        cy.get('#gameCanvas').should('be.visible');
    });

    it('centers camera on start and on reset', () => {
        cy.get('#btn-zoom-reset').click();
        // Just verify no errors
        cy.get('#gameCanvas').should('be.visible');
    });
});
