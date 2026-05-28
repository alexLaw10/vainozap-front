import { Injectable, signal } from '@angular/core';

import type { PlanoFeatures } from './plano-context.service';

export interface UpgradeModalState {
  open: boolean;
  /** Feature que disparou o bloqueio — usada para destacar o plano mínimo. */
  feature: keyof PlanoFeatures | null;
  /** Mensagem customizada opcional (ex: vinda do backend via 402). */
  mensagem: string | null;
}

/**
 * Serviço global para abrir/fechar o modal de upgrade de plano.
 *
 * Uso:
 *   inject(UpgradeModalService).abrir('videos');
 *   inject(UpgradeModalService).abrir(null, 'Seu plano não permite isso.');
 */
@Injectable({ providedIn: 'root' })
export class UpgradeModalService {
  readonly state = signal<UpgradeModalState>({
    open: false,
    feature: null,
    mensagem: null,
  });

  abrir(feature: keyof PlanoFeatures | null = null, mensagem: string | null = null): void {
    this.state.set({ open: true, feature, mensagem });
  }

  fechar(): void {
    this.state.update((s) => ({ ...s, open: false }));
  }
}
