import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { PlanoContextService, type PlanoFeatures } from '../../features/merchant/services/plano-context.service';
import { UpgradeModalService } from '../../features/merchant/services/upgrade-modal.service';

/**
 * Guard de plano — bloqueia rotas que exigem uma feature específica.
 *
 * Uso nas rotas:
 * ```typescript
 * {
 *   path: 'pixel',
 *   canActivate: [planoGuard],
 *   data: { feature: 'pixel' },
 *   loadComponent: () => import('./pixel-page.component'),
 * }
 * ```
 *
 * Quando bloqueado:
 *  - Abre o UpgradeModal com a feature específica
 *  - Retorna false (mantém o usuário na página atual)
 */
export const planoGuard: CanActivateFn = (route) => {
  const plano   = inject(PlanoContextService);
  const upgrade = inject(UpgradeModalService);

  const feature = route.data?.['feature'] as keyof PlanoFeatures | undefined;

  // Se não há feature configurada na rota, deixa passar
  if (!feature) return true;

  if (plano.temFeature(feature)) return true;

  // Sem acesso → abre modal e bloqueia navegação
  upgrade.abrir(feature);
  return false;
};
