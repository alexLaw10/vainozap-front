import { Component, input } from '@angular/core';

/**
 * Grid responsivo para cards — usa `auto-fill` + `minmax` para adaptar colunas
 * automaticamente ao espaço disponível.
 *
 * @example
 * <app-card-grid>
 *   <app-section-card title="Cliente">...</app-section-card>
 *   <app-section-card title="Pagamento">...</app-section-card>
 *   <app-section-card title="Entrega">...</app-section-card>
 * </app-card-grid>
 *
 * <!-- Colunas mais largas -->
 * <app-card-grid minWidth="320px" gap="1.5rem">...</app-card-grid>
 */
@Component({
  selector: 'app-card-grid',
  standalone: true,
  host: {
    class: 'cg',
    '[style.--cg-min]': 'minWidth()',
    '[style.--cg-gap]': 'gap()',
  },
  template: `<ng-content />`,
  styleUrl: './card-grid.component.scss',
})
export class CardGridComponent {
  /** Largura mínima de cada coluna antes de quebrar para nova linha. */
  readonly minWidth = input('260px');
  /** Gap entre cards. */
  readonly gap      = input('1rem');
}
