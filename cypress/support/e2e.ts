// ─── Global hooks & custom commands ───────────────────────────────────────────

import { registerMerchantApiStubs } from './merchant-api-stubs';

// ── Silencia erros de EventSource/SSE (esperados no ambiente de testes) ───────
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('EventSource') ||
    err.message.includes('SSE') ||
    err.message.includes('net::ERR_')
  ) {
    return false;
  }
  return true;
});

// ── Custom commands ────────────────────────────────────────────────────────────

/**
 * cy.loginMerchant()
 * Faz login com a API simulada e aguarda o redirecionamento para /merchant.
 */
Cypress.Commands.add('loginMerchant', () => {
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

// ── TypeScript: declara o comando no namespace Cypress ────────────────────────
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginMerchant(): Chainable<void>;
    }
  }
}
