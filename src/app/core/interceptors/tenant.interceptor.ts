import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../features/auth/services/auth.service';
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
  // Quando estamos na área merchant, identificar o tenant do lojista autenticado.
  // Prioridade:
  //   1. sfContext.tenant()?.slug — já carregado após /merchant/settings
  //   2. auth.slug()              — extraído diretamente do JWT (disponível desde o login)
  //      Fallback necessário para chamadas que acontecem antes de sfContext estar populado
  //      (ex: categorias/produtos da vitrine interna carregados logo após o login)
  if (window.location.pathname.startsWith('/merchant')) {
    const sfContext = inject(StorefrontContextService);
    const auth      = inject(AuthService);
    return sfContext.tenant()?.slug ?? auth.slug() ?? null;
  }

  // Storefront público: resolver por subdomínio ou devTenantSlug
  const hostname = window.location.hostname;
  if (hostname.endsWith(environment.domainSuffix)) {
    return hostname.slice(0, -environment.domainSuffix.length);
  }
  return environment.devTenantSlug ?? null;
}
