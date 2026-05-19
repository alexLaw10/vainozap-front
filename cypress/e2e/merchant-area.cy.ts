import { registerMerchantApiStubs } from '../support/merchant-api-stubs';

describe('Merchant — navegação principal com API simulada', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    registerMerchantApiStubs();
    cy.intercept('POST', '**/api/v1/auth/login', { fixture: 'login-response.json' }).as('login');

    cy.visit('/auth/login');
    cy.get('#login-email').type('lojista@e2e.test');
    cy.get('#login-senha').type('senha123');
    cy.contains('button', 'Entrar').click();
    cy.wait('@login');
    cy.url().should('include', '/merchant');
  });

  it('carrega o painel e acessa vitrine, pedidos e vendas', () => {
    cy.get('#merchant-dash-resumo').should('contain', 'Resumo de hoje');

    cy.visit('/merchant/loja/vitrine');
    cy.contains('h2', 'Categorias').should('be.visible');

    cy.visit('/merchant/orders/pedidos');
    cy.contains('h1', 'Pedidos').should('be.visible');
    cy.contains('Maria Pedido').should('be.visible');

    cy.visit('/merchant/orders/vendas');
    cy.contains('p', 'Resumo de vendas concluídas').should('be.visible');
  });

  it('acessa a página de contas do lojista', () => {
    cy.visit('/merchant/contas');
    cy.contains('h2', 'Minha conta').should('be.visible');
    cy.contains('.merchant-contas__account-name', 'Usuário E2E').should('be.visible');
  });
});
