/**
 * storefront-checkout.cy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Testa o fluxo completo: produto → carrinho → preencher dados → finalizar.
 * A API é simulada via cy.intercept; não requer backend rodando.
 */

import { registerStorefrontApiStubs } from '../support/storefront-api-stubs';

describe('Storefront — checkout até confirmação (mock)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    registerStorefrontApiStubs();
  });

  it('preenche dados, finaliza e exibe confirmação do pedido', () => {
    // Adiciona produto ao carrinho
    cy.visit('/products/sf-prod-1');
    cy.wait('@sfProductDetail');
    cy.contains('button', 'Comprar').click();

    // Usa o CTA do toast para ir ao carrinho
    cy.get('.sf-toast__cta').click();
    cy.url().should('include', '/cart');
    cy.contains('h2', 'Confira seu pedido').should('be.visible');

    // Preenche formulário de checkout
    cy.get('#cart-nome').type('João Teste E2E');
    cy.get('#cart-doc').type('52998224725');
    cy.get('#cart-tel').type('11987654321');

    // Seleciona forma de pagamento (app-select renderiza <select id="cart-pay">)
    cy.get('#cart-pay').select('pix');

    // Finaliza o pedido
    cy.contains('button', 'Finalizar o Pedido').click();
    cy.wait('@sfCreateOrder');

    // Exibe modal de confirmação
    cy.contains('.cart-confirm__lead', 'WhatsApp').should('be.visible');
    cy.contains('.cart-confirm__order-id', 'Pedido #').should('be.visible');
    cy.contains('.cart-confirm__name', 'João Teste E2E').should('be.visible');
    cy.get('.cart-confirm__wa').should('be.visible').and('contain.text', 'Enviar via WhatsApp');
  });
});
