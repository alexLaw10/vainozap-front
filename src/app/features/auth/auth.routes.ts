import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/auth-login-page.component').then(
        (m) => m.AuthLoginPageComponent,
      ),
  },
  {
    path: 'cadastro',
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
