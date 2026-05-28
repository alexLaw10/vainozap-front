import { Routes } from '@angular/router';

import { noAuthGuard } from '../../core/guards/no-auth.guard';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./pages/login/auth-login-page.component').then(
        (m) => m.AuthLoginPageComponent,
      ),
  },
  {
    path: 'cadastro',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./pages/cadastro/auth-cadastro-page.component').then(
        (m) => m.AuthCadastroPageComponent,
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/auth-forgot-password-page.component').then(
        (m) => m.AuthForgotPasswordPageComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/auth-reset-password-page.component').then(
        (m) => m.AuthResetPasswordPageComponent,
      ),
  },
];
