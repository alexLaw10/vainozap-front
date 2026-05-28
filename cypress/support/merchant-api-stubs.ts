/**
 * registerMerchantApiStubs
 * ─────────────────────────────────────────────────────────────────────────────
 * Registra cy.intercept() para todas as chamadas da área merchant.
 * Deve ser chamado no início de cada teste que acessa /merchant.
 *
 * Padrão de alias: @<recurso>   ex.: @dashboardResumo, @merchantOrders
 */
export function registerMerchantApiStubs(): void {
  // ── SSE de notificações ─────────────────────────────────────────────────────
  // EventSource não suporta intercept real; retornamos 200 vazio para não travar.
  cy.intercept('GET', '**/api/v1/merchant/notifications/stream*', {
    statusCode: 200,
    headers: { 'Content-Type': 'text/event-stream' },
    body: 'event: connected\ndata: {}\n\n',
  }).as('notifStream');

  // ── Dashboard ───────────────────────────────────────────────────────────────
  cy.intercept('GET', '**/api/v1/merchant/dashboard/resumo', {
    fixture: 'dashboard-resumo.json',
  }).as('dashboardResumo');

  // ── Configurações da loja ───────────────────────────────────────────────────
  cy.intercept('GET', '**/api/v1/merchant/settings', {
    fixture: 'tenant-api.json',
  }).as('merchantSettings');

  cy.intercept('PUT', '**/api/v1/merchant/settings', {
    fixture: 'tenant-api.json',
  }).as('merchantSettingsSave');

  // ── Produtos ────────────────────────────────────────────────────────────────
  cy.intercept('GET', '**/api/v1/merchant/products*', {
    fixture: 'products-list.json',
  }).as('merchantProducts');

  // Detalhe de produto específico (deve ficar APÓS o glob para ter precedência)
  cy.intercept('GET', '**/api/v1/merchant/products/p-stock-1', {
    body: {
      id: 'p-stock-1',
      nome: 'Produto estoque E2E',
      preco: 99.90,
      descricao: null,
      ativo: true,
      semEstoque: false,
      estoque: 5,
      fotos: [],
      categoriaId: null,
      variacoes: [],
    },
  }).as('productDetail');

  cy.intercept('POST', '**/api/v1/merchant/products', {
    statusCode: 201,
    body: {
      id: 'p-new-1',
      nome: 'Produto salvo E2E',
      preco: 59.90,
      estoque: 10,
      ativo: true,
      categoriaId: null,
      descricao: null,
      imagens: [],
      variacoes: [],
    },
  }).as('createProduct');

  cy.intercept('PUT', '**/api/v1/merchant/products/*', { statusCode: 200, body: {} }).as('updateProduct');
  cy.intercept('DELETE', '**/api/v1/merchant/products/*', { statusCode: 204 }).as('deleteProduct');

  // ── Estoque ─────────────────────────────────────────────────────────────────
  cy.intercept('PATCH', '**/api/v1/merchant/products/*/estoque', {
    statusCode: 200,
    body: { estoqueAtual: 7 },
  }).as('patchEstoque');

  // ── Categorias ──────────────────────────────────────────────────────────────
  cy.intercept('GET', '**/api/v1/merchant/categories*', { body: [] }).as('merchantCategories');
  cy.intercept('GET', '**/api/v1/merchant/categories/options', { body: [] }).as('categoryOptions');

  cy.intercept('POST', '**/api/v1/merchant/categories', {
    statusCode: 201,
    body: { id: 'cat-1', nome: 'Categoria Cypress', ativo: true },
  }).as('createCategory');

  // ── Modelos de variação ─────────────────────────────────────────────────────
  cy.intercept('GET', '**/api/v1/merchant/variacao-templates*', { body: [] }).as('variacaoTemplates');

  cy.intercept('POST', '**/api/v1/merchant/variacao-templates', {
    statusCode: 201,
    body: {
      id: 'vt-1',
      nome: 'Modelo Tamanhos',
      variacoes: [{ nome: 'Tamanho', opcoes: [{ valor: 'M' }] }],
    },
  }).as('createTemplate');

  // ── Pedidos ─────────────────────────────────────────────────────────────────
  cy.intercept('GET', '**/api/v1/merchant/orders*', {
    fixture: 'orders-list.json',
  }).as('merchantOrders');

  cy.intercept('GET', '**/api/v1/merchant/orders/order-e2e-1', {
    fixture: 'order-detail.json',
  }).as('orderDetail');

  cy.intercept('PATCH', '**/api/v1/merchant/orders/*/status', {
    statusCode: 200,
    body: {
      id: 'order-e2e-1',
      tenantId: 't-e2e',
      status: 'NOVO',
      subtotal: 150.00,
      criadoEm: '2026-05-25T10:00:00Z',
      cliente: { nome: 'Maria Pedido', cpfCnpj: '123.456.789-00', telefone: '11999990001', observacoes: null },
      pagamento: { forma: 'pix', bandeira: null, parcelas: null, modoCartao: null, trocoPara: null },
      entrega: { modo: 'retirada', cep: null, logradouro: null, numero: null, bairro: null, uf: null, cidade: null, complemento: null },
      linhas: [{ id: 'linha-e2e-1', productId: 'p-1', titulo: 'Produto E2E', quantidade: 2, precoUnit: 75.00 }],
    },
  }).as('patchStatus');

  // ── Vendas ──────────────────────────────────────────────────────────────────
  cy.intercept('GET', '**/api/v1/merchant/vendas/resumo*', {
    fixture: 'vendas-resumo.json',
  }).as('vendasResumo');

  // ── Perfil e lojas ──────────────────────────────────────────────────────────
  cy.intercept('GET', '**/api/v1/merchant/me', {
    fixture: 'merchant-me.json',
  }).as('merchantMe');

  cy.intercept('GET', '**/api/v1/merchant/my-stores', {
    fixture: 'my-stores.json',
  }).as('merchantStores');

  cy.intercept('POST', '**/api/v1/merchant/my-stores/*/switch', {
    fixture: 'login-response.json',
  }).as('merchantStoreSwitch');

  // ── Storefront (usado pela vitrine interna do merchant e em testes de storefront) ──
  cy.intercept('GET', '**/api/v1/storefront/products*', { body: [] }).as('sfProducts');
  cy.intercept('GET', '**/api/v1/storefront/categories*', { body: [] }).as('sfCategories');

  // ── Tenant context (usada pelo storefront para descobrir a loja) ─────────────
  cy.intercept('GET', '**/api/v1/stores/slug/**', {
    fixture: 'tenant-api.json',
  }).as('tenantContext');
}
