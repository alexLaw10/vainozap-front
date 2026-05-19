import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

/**
 * App shell — top-level URLs
 * | Path | Area |
 * |------|------|
 * | `/` | Storefront (see `storefront.routes.ts`) |
 * | `/auth` | Autenticação do lojista (login / cadastro) |
 * | `/merchant` | Merchant — protegido por authGuard (see `merchant.routes.ts`) |
 * | `**` | Redirects to `/` |
 */
export const routes: Routes = [
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
