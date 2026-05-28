import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../../features/auth/services/auth.service';

/**
 * Redireciona para /merchant se o usuário já estiver autenticado.
 * Usado nas rotas de auth (login, cadastro) para evitar que um lojista
 * logado fique preso na tela de login após um redirect inesperado.
 */
export const noAuthGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated()
    ? router.createUrlTree(['/merchant'])
    : true;
};
