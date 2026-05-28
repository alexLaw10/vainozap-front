import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

export type StatCardAccent = 'primary' | 'success' | 'warning' | 'danger';
export type StatCardValueVariant = 'default' | 'money' | 'alert' | 'muted';

/**
 * Card de métrica com label eyebrow + valor destacado.
 *
 * @example
 * <app-stat-card label="Pedidos hoje" value="12" />
 * <app-stat-card label="Vendas (mês)" value="R$ 4.280" accent="success" valueVariant="money" />
 * <app-stat-card label="Em aberto"    value="3"  accent="warning" valueVariant="alert" />
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgClass],
  host: {
    class: 'scard',
    '[class.scard--success]': `accent() === 'success'`,
    '[class.scard--warning]': `accent() === 'warning'`,
    '[class.scard--danger]':  `accent() === 'danger'`,
  },
  template: `
    <span class="scard__label">{{ label() }}</span>
    <span
      class="scard__value"
      [ngClass]="'scard__value--' + valueVariant()"
    >{{ value() }}</span>
    @if (sub()) {
      <span class="scard__sub">{{ sub() }}</span>
    }
  `,
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  /** Label eyebrow — exibido acima do valor. */
  readonly label        = input.required<string>();
  /** Valor principal — pode ser número, moeda, texto. */
  readonly value        = input.required<string>();
  /** Texto auxiliar opcional abaixo do valor. */
  readonly sub          = input('');
  /** Cor da borda superior do card. Default: primary. */
  readonly accent       = input<StatCardAccent>('primary');
  /** Variante de cor do valor. */
  readonly valueVariant = input<StatCardValueVariant>('default');
}
