import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../../features/auth/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Sem access token → login
  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);

  // Verifica se o access token está expirado pelo payload
  const payload   = auth.jwtPayload();
  const isExpired = payload?.exp ? payload.exp * 1000 < Date.now() : false;

  if (isExpired) {
    const rt = auth.refreshToken;
    if (!rt) {
      // Sem refresh token e access token expirado → logout imediato na navegação
      auth.logout();
      return router.createUrlTree(['/auth/login']);
    }
    // Há refresh token: deixa passar — o interceptor vai refrescar no primeiro 401
    // (tentar refrescar aqui tornaria o guard assíncrono e bloquearia a navegação)
  }

  return true;
};
