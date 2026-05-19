describe('Storefront — checkout até confirmação (mock)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('preenche dados, finaliza e exibe o resumo de confirmação do pedido', () => {
    cy.visit('/products/1');
    cy.contains('button', 'Adicionar ao carrinho').click();
    cy.url().should('include', '/cart');

    cy.get('#cart-nome').type('João Teste E2E');
    cy.get('#cart-doc').type('52998224725');
    cy.get('#cart-tel').type('11987654321');
    cy.get('#cart-pay').select('pix');

    cy.contains('button', 'Finalizar o Pedido').click();

    cy.contains('.cart-confirm__lead', 'WhatsApp').should('be.visible');
    cy.contains('.cart-confirm__order-id', 'Pedido #').should('be.visible');
    cy.contains('.cart-confirm__name', 'João Teste E2E').should('be.visible');
    cy.contains('button', 'Enviar via WhatsApp').should('be.visible');
  });
});
