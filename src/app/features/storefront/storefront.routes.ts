import { Routes } from '@angular/router';

import { ShellComponent } from './components/shell/shell.component';

/**
 * Storefront — absolute URLs
 * | Path | Page |
 * |------|------|
 * | `/` | Catalog |
 * | `/products/:productId` | Product detail |
 * | `/cart` | Cart |
 * | `/checkout` | Checkout |
 */
export const STOREFRONT_ROUTES: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/catalog-page/catalog-page.component').then((m) => m.CatalogPageComponent),
        data: { title: 'Catalog' },
      },
      {
        path: 'products/:productId',
        loadComponent: () =>
          import('./pages/product-page/product-page.component').then((m) => m.ProductPageComponent),
        data: { title: 'Product' },
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./pages/cart-page/cart-page.component').then((m) => m.CartPageComponent),
        data: { title: 'Cart' },
      },
      {
        path: 'checkout',
        redirectTo: 'cart',
        pathMatch: 'full',
      },
    ],
  },
];
