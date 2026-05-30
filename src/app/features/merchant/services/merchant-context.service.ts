import { computed, inject, Injectable, signal } from '@angular/core';

import { AuthService } from '../../auth/services/auth.service';
import { StorefrontContextService } from '../../storefront/services/storefront-context.service';

@Injectable()
export class MerchantContextService {
  private readonly sfContext = inject(StorefrontContextService);
  private readonly auth      = inject(AuthService);

  /** true enquanto carrega o tenant completo do lojista autenticado */
  readonly loading = signal(false);

  /**
   * Nome da loja exibido no painel.
   * Lido diretamente do payload JWT — sem nenhuma requisição extra.
   * Fallback para o contexto do storefront caso o token seja antigo.
   */
  readonly shopLabel = computed(() =>
    this.auth.nomeLoja()
    || this.sfContext.tenant()?.nomeLoja
    || '…'
  );

  /**
   * Slug atual da loja — lido do tenant (fonte de verdade após salvar),
   * com fallback para o JWT. Garante que o botão "Ver vitrine" reflita
   * imediatamente qualquer alteração de slug feita pelo lojista.
   */
  readonly slug = computed(() =>
    this.sfContext.tenant()?.slug
    || this.auth.slug()
    || ''
  );
}
