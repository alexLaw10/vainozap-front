describe('Storefront — catálogo e carrinho', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('exibe o catálogo em mock e conclui adicionar ao carrinho até o resumo', () => {
    cy.visit('/');
    cy.contains('h2', 'Categorias').should('be.visible');
    cy.contains('.product-card__title', 'Blusa Listrada Premium').should('be.visible');

    cy.visit('/products/1');
    cy.get('#product-title').should('contain', 'Blusa Listrada Premium');
    cy.contains('button', 'Adicionar ao carrinho').click();

    cy.url().should('include', '/cart');
    cy.contains('h2', 'Confira seu pedido').should('be.visible');
    cy.contains('.cart-modal__item-title', 'Blusa Listrada Premium').should('exist');
  });
});
