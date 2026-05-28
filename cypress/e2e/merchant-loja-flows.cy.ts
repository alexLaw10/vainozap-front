/**
 * merchant-loja-flows.cy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fluxos de interação na área merchant: configurar, produtos, categorias,
 * estoque, variações, pedidos e troca de loja.
 *
 * Todos os testes usam cy.loginMerchant() + stubs da API simulada.
 */

describe('Merchant — fluxos de loja (API simulada)', () => {
  beforeEach(() => {
    cy.loginMerchant();
  });

  // ── Configurar loja ─────────────────────────────────────────────────────────

  it('salva alterações em Configurar loja', () => {
    cy.visit('/merchant/loja/configurar');
    cy.contains('h1', 'Configurar loja').should('be.visible');

    // O campo "Nome da loja" é um app-input dentro de .cfg-field--full
    cy.contains('.mcat-field__label, label', 'Nome da loja')
      .closest('app-input, .cfg-field--full')
      .find('input')
      .first()
      .clear()
      .type('Loja Cypress');

    cy.contains('button', 'Salvar alterações').first().click();
    cy.wait('@merchantSettingsSave');
    cy.get('.cfg-success').should('be.visible');
  });

  // ── Produtos ────────────────────────────────────────────────────────────────

  it('cria produto novo e navega para a lista', () => {
    cy.visit('/merchant/loja/cadastrar/produtos');
    cy.contains('h1', 'Novo produto').should('be.visible');

    cy.get('#pf-nome').type('Camiseta Cypress');
    cy.get('#pf-preco').clear().type('59.90');
    cy.get('#pf-estoque').clear().type('10');

    cy.contains('button', 'Salvar produto').click();
    cy.wait('@createProduct');
    cy.url().should('include', '/merchant/loja/gerenciar/produtos');
  });

  it('abre edição de produto existente e salva', () => {
    cy.visit('/merchant/loja/gerenciar/produtos/p-stock-1/editar');
    cy.contains('h1', 'Editar produto').should('be.visible');

    cy.get('#pf-nome').clear().type('Produto estoque E2E renomeado');
    cy.contains('button', 'Salvar produto').click();
    cy.wait('@updateProduct');
    cy.url().should('include', '/merchant/loja/gerenciar/produtos');
  });

  // ── Categorias ──────────────────────────────────────────────────────────────

  it('cria categoria via modal', () => {
    cy.visit('/merchant/loja/cadastrar/categorias');
    cy.contains('button', '+ Nova categoria').click();

    cy.get('app-modal').within(() => {
      // Primeiro input = campo Nome *
      cy.get('input').first().type('Categoria Cypress');
      cy.contains('button', 'Criar').click();
    });

    cy.wait('@createCategory');
    // Modal fecha após criação bem-sucedida
    cy.get('app-modal').should('not.exist');
  });

  // ── Estoque ─────────────────────────────────────────────────────────────────

  it('registra ajuste de estoque em produto simples', () => {
    cy.visit('/merchant/loja/gerenciar/estoque');
    cy.contains('h1', 'Controle de Estoque').should('be.visible');
    cy.contains('.est-nome', 'Produto estoque E2E').should('be.visible');

    // Abre modal de ajuste pelo botão na linha do produto
    cy.get('.est-btn-ajuste').first().click();
    cy.get('app-modal').should('be.visible');

    // Preenche a quantidade no input numérico da modal
    cy.get('app-modal').find('input[type="number"]').clear().type('2');
    cy.get('app-modal').contains('button', 'Confirmar').click();

    cy.wait('@patchEstoque');
    cy.get('app-modal').should('not.exist');
  });

  // ── Modelos de variação ─────────────────────────────────────────────────────

  it('cria modelo de variação com uma opção', () => {
    // Após o POST, o reload do GET devolve o template criado
    cy.intercept('GET', '**/api/v1/merchant/variacao-templates*', {
      body: [
        {
          id: 'vt-1',
          nome: 'Modelo Tamanhos',
          variacoes: [{ id: 'v1', nome: 'Tamanho', tipo: 'TEXT', opcoes: [{ id: 'o1', valor: 'M', swatch: null }] }],
        },
      ],
    }).as('variacaoTemplatesReloaded');

    cy.visit('/merchant/loja/cadastrar/variacoes');
    cy.contains('button', '+ Novo modelo').click();

    cy.get('app-modal').within(() => {
      // Nome do modelo
      cy.get('input').first().type('Modelo Tamanhos');

      // Adiciona uma variação
      cy.contains('button', '+ Adicionar variação').click();

      cy.get('.mcat-variacao').first().within(() => {
        cy.get('input').first().type('Tamanho');
        cy.contains('button', '+ Opção').click();
        cy.get('.vt-opcao-row input').first().type('M');
      });

      cy.contains('button[type="submit"]', 'Criar modelo').click();
    });

    cy.wait('@createTemplate');
    cy.contains('.vt-card__nome', 'Modelo Tamanhos').should('be.visible');
  });

  // ── Pedidos ─────────────────────────────────────────────────────────────────

  it('lista pedido, abre detalhe e avança status', () => {
    cy.visit('/merchant/orders/pedidos');
    cy.contains('Maria Pedido').should('be.visible');

    // Navega direto ao detalhe
    cy.visit('/merchant/orders/pedidos/order-e2e-1');
    cy.contains('h1', 'Pedido').should('be.visible');
    cy.contains('.ord-det__id', 'order-e2e-1').should('be.visible');

    // Status inicial: AGUARDANDO_PAGAMENTO
    // Abre o dropdown de status e seleciona "Iniciar preparo" (→ NOVO)
    cy.get('.sm-trigger').click();
    cy.contains('.sm-menu__item', 'Iniciar preparo').click();

    cy.wait('@patchStatus');
    // Badge reflete o status retornado pela API stub (NOVO = "Novo")
    cy.get('.ord-det__status-badge').should('contain.text', 'Novo');
  });

  // ── Contas / Lojas ──────────────────────────────────────────────────────────

  it('troca de loja em Minhas lojas', () => {
    cy.visit('/merchant/contas');
    cy.contains('h2', 'Minhas lojas').should('be.visible');
    cy.contains('.merchant-contas__loja-nome', 'Filial E2E').should('be.visible');

    cy.contains('button', 'Trocar').click();
    cy.wait('@merchantStoreSwitch');
    cy.url().should('include', '/merchant');
  });
});
