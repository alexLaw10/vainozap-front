import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { StorefrontContextService } from '../../features/storefront/services/storefront-context.service';

export function tenantInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Rotas merchant e auth: tenant vem do JWT — nunca expor slug de outro tenant
  if (req.url.includes('/api/v1/merchant') || req.url.includes('/api/v1/auth')) {
    return next(req);
  }

  const slug = resolveSlug();
  if (!slug) return next(req);

  return next(req.clone({ setHeaders: { 'X-Tenant-Slug': slug } }));
}

function resolveSlug(): string | null {
  // Quando estamos na área merchant, usar o slug do tenant autenticado
  // (já carregado pelo MerchantContextService via /api/v1/merchant/settings)
  if (window.location.pathname.startsWith('/merchant')) {
    const sfContext = inject(StorefrontContextService);
    const slug = sfContext.tenant()?.slug;
    if (slug) return slug;
  }

  // Storefront público: resolver por subdomínio ou devTenantSlug
  const hostname = window.location.hostname;
  if (hostname.endsWith(environment.domainSuffix)) {
    return hostname.slice(0, -environment.domainSuffix.length);
  }
  return environment.devTenantSlug;
}
