export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  domainSuffix: '.minhaapp.com.br',
  /** Slug usado quando não há subdomínio (localhost). */
  devTenantSlug: '',
  /**
   * true  → usa mock local, não faz chamadas ao backend.
   * false → consome a API real (backend deve estar rodando).
   */
  useMock: false,
};
