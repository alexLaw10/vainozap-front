import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../../features/auth/services/auth.service';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Adiciona Bearer token nas chamadas da área do lojista e nas chamadas
  // de storefront feitas com token disponível (ex: vitrine interna do merchant)
  const token = auth.token();
  if (token && (req.url.includes('/api/v1/merchant') || req.url.includes('/api/v1/storefront'))) {
    req = addBearer(req, token);
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Só tenta renovar em rotas merchant, com status 401, tendo refresh token,
      // e desde que não seja a própria requisição de refresh (evita loop infinito)
      if (
        err.status === 401 &&
        req.url.includes('/api/v1/merchant') &&
        auth.refreshToken &&
        !req.url.includes('/api/v1/auth/refresh')
      ) {
        /**
         * refreshOnce() garante que apenas UMA requisição POST /auth/refresh
         * seja feita, independentemente de quantas requisições paralelas tenham
         * recebido 401 ao mesmo tempo. As demais aguardam o BehaviorSubject
         * emitir o novo token e então reenviam seus requests com ele.
         */
        return auth.refreshOnce().pipe(
          switchMap((newToken) => next(addBearer(req, newToken))),
          catchError(() => {
            // Refresh falhou (token expirado/revogado) → logout e redireciona
            auth.logout();
            void router.navigate(['/auth/login']);
            return throwError(() => err);
          }),
        );
      }

      return throwError(() => err);
    }),
  );
}

function addBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
