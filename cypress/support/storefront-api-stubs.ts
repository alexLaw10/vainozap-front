/**
 * registerStorefrontApiStubs
 * ─────────────────────────────────────────────────────────────────────────────
 * Intercepta todas as chamadas de API usadas pelo storefront (vitrine pública).
 * Deve ser chamado no início de cada teste de storefront.
 */
export function registerStorefrontApiStubs(): void {
  // ── Tenant context ──────────────────────────────────────────────────────────
  cy.intercept('GET', '**/api/v1/stores/slug/**', {
    fixture: 'tenant-api.json',
  }).as('tenantContext');

  // ── Produtos e categorias ───────────────────────────────────────────────────
  cy.intercept('GET', '**/api/v1/storefront/categories*', { body: [] }).as('sfCategories');

  cy.intercept('GET', '**/api/v1/storefront/products*', {
    fixture: 'storefront-products.json',
  }).as('sfProducts');

  // Detalhe de produto
  cy.intercept('GET', '**/api/v1/storefront/products/sf-prod-1', {
    body: {
      id: 'sf-prod-1',
      nome: 'Camiseta E2E',
      preco: 59.90,
      descricao: 'Produto de teste E2E',
      ativo: true,
      semEstoque: false,
      estoque: 10,
      fotos: [],
      categoriaId: null,
      variacoes: [],
    },
  }).as('sfProductDetail');

  // ── Criação de pedido ───────────────────────────────────────────────────────
  cy.intercept('POST', '**/api/v1/storefront/orders', {
    statusCode: 201,
    body: {
      id: 'sf-order-1',
      tenantId: 't-e2e',
      status: 'AGUARDANDO_PAGAMENTO',
      subtotal: 59.90,
      criadoEm: '2026-05-25T12:00:00Z',
      cliente: { nome: 'João Teste E2E', cpfCnpj: '52998224725', telefone: '11987654321', observacoes: null },
      pagamento: { forma: 'pix', bandeira: null, parcelas: null, modoCartao: null, trocoPara: null },
      entrega: { modo: 'retirada', cep: null, logradouro: null, numero: null, bairro: null, uf: null, cidade: null, complemento: null },
      linhas: [{ id: 'sf-linha-1', productId: 'sf-prod-1', titulo: 'Camiseta E2E', quantidade: 1, precoUnit: 59.90 }],
    },
  }).as('sfCreateOrder');
}
