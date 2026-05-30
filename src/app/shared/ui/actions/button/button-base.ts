import { Directive, input } from '@angular/core';

import type { UiButtonVariant } from './button.types';

/**
 * Base abstrata compartilhada por todos os componentes de botão da aplicação.
 *
 * Centraliza os inputs comuns para que não sejam duplicados entre
 * `ButtonComponent` (app-button) e qualquer outro componente de botão
 * derivado (ex: variante compacta para o painel merchant).
 */
@Directive()
export abstract class ButtonBase {
  readonly variant  = input<UiButtonVariant>('primary');
  /** Tamanho do botão. 'md' = padrão (formulários); 'sm' = compacto (ações inline, painel merchant). */
  readonly size     = input<'sm' | 'md'>('md');
  readonly type     = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading  = input(false);
  readonly inline   = input(false);
}
