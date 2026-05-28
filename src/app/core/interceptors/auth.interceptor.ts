import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../../features/auth/services/auth.service';

/** Flag de instância única para evitar logout/redirect duplicados em 401 concorrentes. */
let _redirecting = false;

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Adiciona Bearer token nas chamadas da área do lojista e nas chamadas
  // de storefront feitas com token disponível (ex: vitrine interna do merchant)
  const token = auth.token();
  if (token && isProtectedUrl(req.url)) {
    req = addBearer(req, token);
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Intercepta 401 em qualquer rota protegida (exceto a própria rota de refresh)
      if (
        err.status === 401 &&
        isProtectedUrl(req.url) &&
        !req.url.includes('/api/v1/auth/refresh')
      ) {
        // Evita que múltiplas requisições simultâneas com 401 disparem logout várias vezes
        if (_redirecting) return throwError(() => err);

        const rt = auth.refreshToken;

        if (rt) {
          /**
           * refreshOnce() garante que apenas UMA requisição POST /auth/refresh
           * seja feita, independentemente de quantas requisições paralelas tenham
           * recebido 401 ao mesmo tempo. As demais aguardam o BehaviorSubject
           * emitir o novo token e então reenviam seus requests com ele.
           */
          return auth.refreshOnce().pipe(
            switchMap((newToken) => next(addBearer(req, newToken))),
            catchError((refreshErr) => {
              // Refresh falhou (token expirado/revogado) → logout e redireciona
              performLogout(auth, router);
              return throwError(() => refreshErr);
            }),
          );
        }

        // Sem refresh token → logout direto e redireciona
        performLogout(auth, router);
      }

      return throwError(() => err);
    }),
  );
}

/** URLs que exigem token Bearer e devem ser monitoradas por 401. */
function isProtectedUrl(url: string): boolean {
  return url.includes('/api/v1/merchant') || url.includes('/api/v1/storefront');
}

/** Garante que logout + redirect só acontecem uma vez, mesmo com múltiplos 401 concorrentes. */
function performLogout(auth: AuthService, router: Router): void {
  if (_redirecting) return;
  _redirecting = true;
  auth.logout();
  void router.navigate(['/auth/login']).then(() => {
    // Reseta o flag após a navegação completar para que futuros logins funcionem
    _redirecting = false;
  });
}

function addBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
