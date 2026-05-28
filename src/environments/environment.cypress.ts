/**
 * Ambiente usado em `ng serve --configuration=cypress` para E2E (Cypress).
 * - `useMock: true` — catálogo storefront sem backend.
 * - `apiUrl: ''` — chamadas HTTP relativas ao host do dev server (`/api/...`),
 *   interceptáveis pelo Cypress e encaminháveis pelo `proxy.conf.json` se necessário.
 */
export const environment = {
  production: false,
  apiUrl: '',
  domainSuffix: '.minhaapp.com.br',
  billingEnabled: false,
  devTenantSlug: 'e2e-dev-tenant',
  useMock: true,
};
