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

  // Adiciona Bearer token apenas nas chamadas da área do lojista
  const token = auth.token();
  if (token && req.url.includes('/api/v1/merchant')) {
    req = addBearer(req, token);
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Se receber 401 em rota merchant e tiver refresh token → tenta renovar
      if (
        err.status === 401 &&
        req.url.includes('/api/v1/merchant') &&
        auth.refreshToken &&
        !req.url.includes('/api/v1/auth/refresh') // evita loop infinito
      ) {
        return auth.refresh().pipe(
          switchMap((res) => {
            // Refaz a requisição original com o novo access token
            return next(addBearer(req, res.token));
          }),
          catchError(() => {
            // Refresh falhou (token expirado/revogado) → logout e redireciona
            auth.logout();
            router.navigate(['/auth/login']);
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
