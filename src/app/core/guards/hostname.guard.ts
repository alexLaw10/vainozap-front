import { CanMatchFn } from '@angular/router';

import { environment } from '../../../environments/environment';

/**
 * Retorna true quando o app está rodando no domínio raiz (sem subdomínio de tenant).
 *
 * Prod:
 *   vainozap.com.br          → true  (mostra landing page)
 *   pacefit.vainozap.com.br  → false (mostra storefront)
 *
 * Dev:
 *   localhost + devTenantSlug configurado → false (simula storefront)
 *   localhost + devTenantSlug null        → true  (mostra landing page)
 */
export const isRootDomain: CanMatchFn = () => {
  const hostname = window.location.hostname;

  // Tem subdomínio de tenant → não é root
  if (hostname.endsWith(environment.domainSuffix)) return false;

  // Dev com slug configurado → simula storefront
  if (environment.devTenantSlug) return false;

  return true;
};
