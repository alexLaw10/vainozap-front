import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { UpgradeModalService } from '../../features/merchant/services/upgrade-modal.service';

/**
 * Interceptor de plano — captura respostas HTTP 402 Payment Required.
 *
 * Quando o backend retorna 402 (ex: limite de lojas, feature bloqueada),
 * abre automaticamente o UpgradeModal com a mensagem do erro.
 *
 * O erro é re-propagado normalmente para que o componente possa
 * tratar casos específicos se quiser (ex: esconder um spinner).
 */
export function planInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Só atua em rotas merchant
  if (!req.url.includes('/api/v1/merchant')) {
    return next(req);
  }

  const upgrade = inject(UpgradeModalService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 402) {
        const mensagem: string | null =
          err.error?.detail ?? err.error?.message ?? null;
        upgrade.abrir(null, mensagem);
      }
      return throwError(() => err);
    }),
  );
}
