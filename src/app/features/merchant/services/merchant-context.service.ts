import { computed, inject, Injectable, signal } from '@angular/core';

import { StorefrontContextService } from '../../storefront/services/storefront-context.service';
import { MerchantConfigService } from './merchant-config.service';

@Injectable()
export class MerchantContextService {
  private readonly configService = inject(MerchantConfigService);
  private readonly sfContext = inject(StorefrontContextService);

  /** true enquanto carrega o tenant do lojista autenticado */
  readonly loading = signal(true);

  /** Nome da loja do lojista autenticado (vem da API, nunca do storefront público) */
  readonly shopLabel = computed(() => this.sfContext.tenant()?.nomeLoja ?? '…');

  constructor() {
    // Carrega o tenant do lojista autenticado e sobrescreve o contexto global.
    // Isso garante que nenhuma página merchant exiba dados de outro tenant,
    // mesmo que o APP_INITIALIZER tenha carregado outro storefront antes.
    this.configService.get().subscribe({
      next: (tenantApi) => {
        this.sfContext.setTenantFromApi(tenantApi);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
