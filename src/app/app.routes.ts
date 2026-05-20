import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { isRootDomain } from './core/guards/hostname.guard';

/**
 * App shell — top-level URLs
 *
 * O roteamento usa detecção de hostname para separar contextos:
 *
 * | Hostname                     | Area                          |
 * |------------------------------|-------------------------------|
 * | vainozap.com.br (root)       | Landing Page                  |
 * | pacefit.vainozap.com.br      | Storefront (vitrine do tenant) |
 * | app.vainozap.com.br          | Merchant (painel do lojista)  |
 * | localhost (sem devTenantSlug)| Landing Page (dev)            |
 * | localhost (com devTenantSlug)| Storefront (dev)              |
 *
 * | Path      | Area                                              |
 * |-----------|---------------------------------------------------|
 * | `/`       | Landing Page (só no domínio raiz) ou Storefront   |
 * | `/auth`   | Autenticação do lojista (login / cadastro)        |
 * | `/merchant` | Merchant — protegido por authGuard              |
 * | `**`      | Redirects to `/`                                  |
 */
export const routes: Routes = [
  // Domínio raiz → Landing Page
  {
    path: '',
    canMatch: [isRootDomain],
    loadChildren: () =>
      import('./features/landing/landing.routes').then((m) => m.LANDING_ROUTES),
  },
  // Subdomínio de tenant → Storefront
  {
    path: '',
    loadChildren: () =>
      import('./features/storefront/storefront.routes').then((m) => m.STOREFRONT_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'merchant',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/merchant/merchant.routes').then((m) => m.MERCHANT_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
