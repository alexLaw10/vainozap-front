export const environment = {
  production: true,
  // URL da API em produção — backend no mesmo domínio via reverse proxy (ALB → ECS)
  // Se frontend e backend ficarem em domínios diferentes, trocar pela URL completa:
  // ex: 'https://api.minhaapp.com.br'
  apiUrl: 'http://vainozap.com.br',
  domainSuffix: '.vainozap.com.br',
  /**
   * Controle temporário de billing:
   * false -> desabilita fluxos de checkout/Asaas no frontend.
   */
  billingEnabled: false,
  devTenantSlug: null,
  useMock: false,
};
