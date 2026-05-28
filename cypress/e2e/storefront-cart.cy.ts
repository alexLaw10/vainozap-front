/**
 * storefront-cart.cy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Testa o fluxo de catálogo → produto → adicionar ao carrinho.
 * A API é simulada via cy.intercept; não requer backend rodando.
 */

import { registerStorefrontApiStubs } from '../support/storefront-api-stubs';

describe('Storefront — catálogo e carrinho', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    registerStorefrontApiStubs();
  });

  it('catálogo carrega e exibe produto', () => {
    cy.visit('/');
    cy.contains('h2', 'Categorias').should('be.visible');
    cy.wait('@sfProducts');
    cy.contains('.product-card__title', 'Camiseta E2E').should('be.visible');
  });

  it('página de produto exibe nome e botão de compra', () => {
    cy.visit('/products/sf-prod-1');
    cy.wait('@sfProductDetail');
    cy.contains('Camiseta E2E').should('be.visible');
    cy.contains('button', 'Comprar').should('be.visible');
  });

  it('adiciona produto ao carrinho e exibe toast de confirmação', () => {
    cy.visit('/products/sf-prod-1');
    cy.wait('@sfProductDetail');

    cy.contains('button', 'Comprar').click();

    // Toast aparece com mensagem e link "Ver pedido"
    cy.get('.sf-toast').should('be.visible');
    cy.get('.sf-toast__msg').should('contain', 'Camiseta E2E');

    // Navega para o carrinho via CTA do toast
    cy.get('.sf-toast__cta').click();
    cy.url().should('include', '/cart');
    cy.contains('h2', 'Confira seu pedido').should('be.visible');
    cy.contains('.cart-modal__item-title', 'Camiseta E2E').should('exist');
  });
});
