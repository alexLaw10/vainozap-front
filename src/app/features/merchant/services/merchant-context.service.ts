import { computed, inject, Injectable, signal } from '@angular/core';

import { AuthService } from '../../auth/services/auth.service';
import { StorefrontContextService } from '../../storefront/services/storefront-context.service';
import { MerchantConfigService } from './merchant-config.service';

@Injectable()
export class MerchantContextService {
  private readonly configService = inject(MerchantConfigService);
  private readonly sfContext     = inject(StorefrontContextService);
  private readonly auth          = inject(AuthService);

  /** true enquanto carrega o tenant completo do lojista autenticado */
  readonly loading = signal(true);

  /**
   * Nome da loja vindo exclusivamente do backend autenticado.
   * Nunca usa TENANT_MOCK — começa como null e só é preenchido
   * pela resposta da API ou pelo localStorage do login.
   */
  private readonly _shopName = signal<string | null>(null);

  /**
   * Nome exibido no painel:
   *   1. localStorage (salvo na resposta do login/register)   → imediato
   *   2. Resposta de GET /api/v1/merchant/settings            → após carregar
   *   3. '…' enquanto ainda não há nada (nunca mostra PaceFit)
   */
  readonly shopLabel = computed(() =>
    this.auth.nomeLoja() || this._shopName() || '…'
  );

  constructor() {
    this.configService.get().subscribe({
      next: (tenantApi) => {
        // Atualiza o nome independente do sfContext (que começa como mock)
        this._shopName.set(tenantApi.nomeLoja ?? null);
        // Persiste no localStorage para próximas visitas
        if (tenantApi.nomeLoja) {
          this.auth.nomeLoja.set(tenantApi.nomeLoja);
          localStorage.setItem('merchant_nome_loja', tenantApi.nomeLoja);
        }
        // Atualiza contexto completo (cores, logo, whatsapp…)
        this.sfContext.setTenantFromApi(tenantApi);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
