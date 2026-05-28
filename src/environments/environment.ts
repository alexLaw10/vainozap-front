export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  domainSuffix: '.minhaapp.com.br',
  /**
   * Controle temporário de billing:
   * false -> desabilita fluxos de checkout/Asaas no frontend.
   */
  billingEnabled: false,
  /** Slug usado quando não há subdomínio (localhost). */
  devTenantSlug: 'minha-loja2',
  /**
   * true  → usa mock local, não faz chamadas ao backend.
   * false → consome a API real (backend deve estar rodando).
   */
  useMock: false,
};
