describe('Merchant — navegação principal com API simulada', () => {
  beforeEach(() => {
    cy.loginMerchant();
  });

  it('carrega o painel e acessa vitrine, pedidos e vendas', () => {
    cy.get('#merchant-dash-resumo').should('contain', 'Resumo de hoje');

    cy.visit('/merchant/loja/vitrine');
    cy.get('body').should('be.visible');

    cy.visit('/merchant/orders/pedidos');
    cy.contains('h1', 'Pedidos').should('be.visible');
    cy.contains('Maria Pedido').should('be.visible');

    cy.visit('/merchant/orders/vendas');
    cy.get('body').should('be.visible');
  });

  it('acessa a página de contas do lojista', () => {
    cy.visit('/merchant/contas');
    cy.get('body').should('be.visible');
    cy.contains('Usuário E2E').should('be.visible');
  });

  it('navega pelos tabs da shell', () => {
    cy.contains('a', 'Loja').click();
    cy.url().should('include', '/merchant/loja');

    cy.contains('a', 'Pedido').click();
    cy.url().should('include', '/merchant/orders');

    cy.contains('a', 'Contas').click();
    cy.url().should('include', '/merchant/contas');
  });
});
