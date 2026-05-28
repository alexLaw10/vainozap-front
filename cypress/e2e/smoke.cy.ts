/**
 * smoke.cy.ts — Testes de fumaça
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifica que as rotas principais carregam sem erros críticos.
 * Rápidos por design: sem interações complexas, só carregamento e elemento chave.
 */

import { registerMerchantApiStubs } from '../support/merchant-api-stubs';

describe('Smoke — rotas públicas', () => {
  it('storefront: página inicial carrega', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
    cy.title().should('not.be.empty');
  });

  it('auth/login: carrega o formulário', () => {
    cy.visit('/auth/login');
    cy.contains('h1', 'Bem-vindo de volta').should('be.visible');
    cy.get('#login-email').should('exist');
    cy.get('#login-senha').should('exist');
    cy.contains('button', 'Entrar').should('be.visible');
  });

  it('auth/cadastro: carrega o formulário', () => {
    cy.visit('/auth/cadastro');
    cy.contains('h1', 'Crie sua conta').should('be.visible');
    cy.get('#cad-nome').should('exist');
    cy.get('#cad-email').should('exist');
  });

  it('auth/forgot-password: carrega o formulário', () => {
    cy.visit('/auth/forgot-password');
    cy.contains('h1', 'Esqueceu a senha?').should('be.visible');
    cy.get('#forgot-email').should('exist');
  });

  it('visitante sem token é barrado em /merchant e vai para o login', () => {
    cy.clearLocalStorage();
    cy.visit('/merchant');
    cy.url().should('include', '/auth/login');
  });
});

describe('Smoke — área merchant (autenticado)', () => {
  beforeEach(() => {
    cy.loginMerchant();
  });

  it('dashboard carrega com o resumo', () => {
    cy.url().should('include', '/merchant');
    cy.get('#merchant-dash-resumo').should('contain', 'Resumo de hoje');
  });

  it('/merchant/loja/vitrine carrega', () => {
    cy.visit('/merchant/loja/vitrine');
    cy.url().should('include', '/merchant/loja/vitrine');
    cy.get('body').should('be.visible');
  });

  it('/merchant/orders/pedidos carrega', () => {
    cy.visit('/merchant/orders/pedidos');
    cy.contains('h1', 'Pedidos').should('be.visible');
  });

  it('/merchant/orders/vendas carrega', () => {
    cy.visit('/merchant/orders/vendas');
    cy.get('body').should('be.visible');
  });

  it('/merchant/contas carrega', () => {
    cy.visit('/merchant/contas');
    cy.get('body').should('be.visible');
  });

  it('/merchant/loja/gerenciar/produtos carrega', () => {
    cy.visit('/merchant/loja/gerenciar/produtos');
    cy.get('body').should('be.visible');
  });

  it('/merchant/loja/gerenciar/estoque carrega', () => {
    cy.visit('/merchant/loja/gerenciar/estoque');
    cy.contains('h1', 'Controle de Estoque').should('be.visible');
  });

  it('/merchant/loja/cadastrar/produtos carrega', () => {
    registerMerchantApiStubs();
    cy.visit('/merchant/loja/cadastrar/produtos');
    cy.contains('h1', 'Novo produto').should('be.visible');
  });

  it('/merchant/loja/configurar carrega', () => {
    cy.visit('/merchant/loja/configurar');
    cy.contains('h1', 'Configurar loja').should('be.visible');
  });
});
