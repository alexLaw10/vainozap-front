import { registerMerchantApiStubs } from '../support/merchant-api-stubs';

function loginMerchant(): void {
  registerMerchantApiStubs();
  cy.intercept('POST', '**/api/v1/auth/login', { fixture: 'login-response.json' }).as('login');
  cy.visit('/auth/login');
  cy.get('#login-email').type('lojista@e2e.test');
  cy.get('#login-senha').type('senha123');
  cy.contains('button', 'Entrar').click();
  cy.wait('@login');
  cy.url().should('include', '/merchant');
}

describe('Merchant — fluxos de loja (API simulada)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    loginMerchant();
  });

  it('salva alterações em Configurar loja', () => {
    cy.intercept('PUT', '**/api/v1/merchant/settings', { fixture: 'tenant-api.json' }).as('saveSettings');
    cy.visit('/merchant/loja/configurar');
    cy.contains('h1', 'Configurar loja').should('be.visible');
    cy.contains('label', 'Nome da loja').parent().find('input').clear().type('Loja Cypress');
    cy.contains('button', 'Salvar alterações').click();
    cy.wait('@saveSettings');
    cy.contains('.cfg-success', 'Salvo com sucesso').should('be.visible');
  });

  it('cria produto novo e lista em Gerenciar', () => {
    cy.intercept('POST', '**/api/v1/merchant/products').as('createProduct');
    cy.visit('/merchant/loja/cadastrar/produtos');
    cy.contains('h1', 'Novo produto').should('be.visible');
    cy.get('#pf-nome').type('Camiseta Cypress');
    cy.get('#pf-preco').clear().type('59.90');
    cy.get('#pf-estoque').clear().type('10');
    cy.contains('button', 'Salvar produto').click();
    cy.wait('@createProduct');
    cy.url().should('include', '/merchant/loja/gerenciar/produtos');
    cy.contains('.mcat-table__td--name', 'Produto salvo E2E').should('exist');
  });

  it('abre edição de produto existente e salva', () => {
    cy.intercept('PUT', '**/api/v1/merchant/products/*').as('updateProduct');
    cy.visit('/merchant/loja/gerenciar/produtos/p-stock-1/editar');
    cy.contains('h1', 'Editar produto').should('be.visible');
    cy.get('#pf-nome').clear().type('Produto estoque E2E renomeado');
    cy.contains('button', 'Salvar produto').click();
    cy.wait('@updateProduct');
    cy.url().should('include', '/merchant/loja/gerenciar/produtos');
  });

  it('cria categoria pela modal', () => {
    cy.intercept('POST', '**/api/v1/merchant/categories').as('createCat');
    cy.visit('/merchant/loja/cadastrar/categorias');
    cy.contains('button', '+ Nova categoria').click();
    cy.get('app-modal').within(() => {
      cy.get('input').first().clear().type('Categoria Cypress');
      cy.contains('button', 'Criar').click();
    });
    cy.wait('@createCat');
    cy.contains('.mcat-table__td--name', 'Categoria Cypress').should('be.visible');
  });

  it('registra ajuste de estoque em produto simples', () => {
    cy.intercept('PATCH', '**/api/v1/merchant/products/*/estoque').as('patchEstoque');
    cy.visit('/merchant/loja/gerenciar/estoque');
    cy.contains('h1', 'Controle de Estoque').should('be.visible');
    cy.contains('.est-nome', 'Produto estoque E2E').should('be.visible');
    cy.get('button.est-btn-ajuste').first().click();
    cy.get('.est-qty-input').clear().type('2');
    cy.contains('.est-modal button', 'Confirmar').click();
    cy.wait('@patchEstoque');
    cy.contains('.est-badge', '7 un.').should('exist');
  });

  it('cria modelo de variação com uma opção', () => {
    cy.intercept('POST', '**/api/v1/merchant/variacao-templates').as('createTpl');
    cy.visit('/merchant/loja/cadastrar/variacoes');
    cy.contains('button', '+ Novo modelo').click();
    cy.get('.mcat-modal').find('input[placeholder*="Tênis"]').type('Modelo Tamanhos');
    cy.contains('button', '+ Adicionar variação').click();
    cy.get('.mcat-variacao').first().within(() => {
      cy.get('input').first().type('Tamanho');
      cy.contains('button', '+ Opção').click();
      cy.get('.vt-opcao-valor').type('M');
    });
    cy.get('.mcat-modal').find('button[type="submit"]').contains('Criar modelo').click();
    cy.wait('@createTpl');
    cy.contains('.vt-card__nome', 'Modelo Tamanhos').should('be.visible');
  });

  it('lista pedido, abre detalhe e avança status', () => {
    cy.intercept('PATCH', '**/api/v1/merchant/orders/*/status').as('patchStatus');
    cy.visit('/merchant/orders/pedidos');
    cy.contains('Maria Pedido').should('be.visible');
    cy.visit('/merchant/orders/pedidos/order-e2e-1');
    cy.contains('h1', 'Pedido').should('be.visible');
    cy.contains('.ord-det__id', 'order-e2e-1').should('be.visible');
    cy.contains('button', 'Iniciar preparo').click();
    cy.wait('@patchStatus');
    cy.contains('.ord-det__status-badge', 'Em preparo').should('be.visible');
  });

  it('troca de loja em Minhas lojas', () => {
    cy.visit('/merchant/contas');
    cy.contains('h2', 'Minhas lojas').should('be.visible');
    cy.contains('.merchant-contas__loja-nome', 'Filial E2E').should('be.visible');
    cy.contains('button', 'Trocar').click();
    cy.wait('@merchantStoreSwitch');
    cy.url().should('include', '/merchant');
  });
});
