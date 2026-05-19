import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import localePt from '@angular/common/locales/pt';
import { firstValueFrom, of } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { tenantInterceptor } from './core/interceptors/tenant.interceptor';
import { StorefrontContextService } from './features/storefront/services/storefront-context.service';

registerLocaleData(localePt, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
    provideHttpClient(withInterceptors([tenantInterceptor, authInterceptor])),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
    {
      provide: APP_INITIALIZER,
      useFactory: (ctx: StorefrontContextService) => () => {
        // Não carregar dados do storefront em rotas merchant/auth — tenant vem do JWT
        const path = window.location.pathname;
        if (path.startsWith('/merchant') || path.startsWith('/auth')) {
          return firstValueFrom(of(void 0));
        }
        return firstValueFrom(ctx.load());
      },
      deps: [StorefrontContextService],
      multi: true,
    },
  ],
};
