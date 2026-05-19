import { registerMerchantApiStubs } from '../support/merchant-api-stubs';

describe('Auth — rotas públicas e formulários', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('redireciona visitante sem sessão da área merchant para o login', () => {
    cy.visit('/merchant');
    cy.url().should('include', '/auth/login');
    cy.contains('h1', 'Bem-vindo de volta').should('be.visible');
  });

  it('faz login com API simulada e abre o painel', () => {
    registerMerchantApiStubs();
    cy.intercept('POST', '**/api/v1/auth/login', { fixture: 'login-response.json' }).as('login');

    cy.visit('/auth/login');
    cy.get('#login-email').type('lojista@e2e.test');
    cy.get('#login-senha').type('senha123');
    cy.contains('button', 'Entrar').click();
    cy.wait('@login');
    cy.url().should('include', '/merchant');
    cy.get('#merchant-dash-resumo').should('contain', 'Resumo de hoje');
  });

  it('envia fluxo de esqueci a senha e mostra confirmação', () => {
    cy.intercept('POST', '**/api/v1/auth/forgot-password', { statusCode: 204 }).as('forgot');
    cy.visit('/auth/forgot-password');
    cy.contains('h1', 'Esqueceu a senha?').should('be.visible');
    cy.get('#forgot-email').type('user@example.com');
    cy.contains('button', 'Enviar link de recuperação').click();
    cy.wait('@forgot');
    cy.contains('h1', 'Verifique seu e-mail').should('be.visible');
  });

  it('redefine senha com token na URL e mostra sucesso', () => {
    cy.intercept('POST', '**/api/v1/auth/reset-password', { statusCode: 204 }).as('reset');
    cy.visit('/auth/reset-password?token=e2e-token');
    cy.contains('h1', 'Nova senha').should('be.visible');
    cy.get('#nova-senha').type('novaSen1');
    cy.get('#confirmar-senha').type('novaSen1');
    cy.contains('button', 'Redefinir senha').click();
    cy.wait('@reset');
    cy.contains('h1', 'Senha redefinida!').should('be.visible');
  });

  it('percorre cadastro em duas etapas e cria conta com API simulada', () => {
    registerMerchantApiStubs();
    cy.intercept('POST', '**/api/v1/auth/register', { fixture: 'login-response.json' }).as('register');

    cy.visit('/auth/cadastro');
    cy.contains('h1', 'Crie sua conta').should('be.visible');
    cy.get('#cad-nome').type('Fulano E2E');
    cy.get('#cad-whatsapp').type('11999998888');
    cy.get('#cad-email').type('novo@e2e.test');
    cy.get('#cad-senha').type('senha12');
    cy.get('#cad-confirmar').type('senha12');
    cy.get('#cad-loja').type('Minha Loja E2E');
    cy.get('#cad-slug').clear().type('minha-loja-e2e');

    cy.contains('button', 'Continuar').click();
    cy.contains('h1', 'Escolha seu plano').should('be.visible');
    cy.contains('button', 'Criar conta grátis').click();
    cy.wait('@register');
    cy.url().should('include', '/merchant');
    cy.get('#merchant-dash-resumo').should('contain', 'Resumo de hoje');
  });
});
