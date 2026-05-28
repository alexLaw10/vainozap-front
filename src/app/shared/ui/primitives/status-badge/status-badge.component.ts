import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

export type UiStatusBadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'blue'      // em trânsito / enviado
  | 'violet'    // em preparo / processando
  | 'amber'     // aguardando / pendente
  | 'purple';   // alias de violet — conveniência

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="ui-status-badge" [ngClass]="'ui-status-badge--' + variant()">
      {{ label() }}
    </span>
  `,
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly variant = input<UiStatusBadgeVariant>('neutral');
}
