import { Component, input } from '@angular/core';
import { NgStyle } from '@angular/common';

/**
 * Skeleton de carregamento — substitui texto "Carregando…" por barras animadas.
 *
 * @example
 * <!-- 1 linha (padrão) -->
 * <ui-skeleton />
 *
 * <!-- 3 linhas com larguras variadas -->
 * <ui-skeleton [lines]="3" [widths]="['100%', '75%', '50%']" />
 *
 * <!-- Bloco de altura fixa (ex: card) -->
 * <ui-skeleton height="8rem" />
 */
@Component({
  selector: 'ui-skeleton',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div class="ui-skel" [class.ui-skel--inline]="inline()" aria-hidden="true">
      @for (w of lineWidths(); track $index) {
        <span class="ui-skel__bar" [ngStyle]="{ width: w, height: height() }"></span>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .ui-skel {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      &--inline {
        flex-direction: row;
        align-items: center;
        gap: 0.75rem;
      }
    }

    .ui-skel__bar {
      display: block;
      border-radius: 0.375rem;
      background: linear-gradient(
        90deg,
        var(--color-border-default)      0%,
        var(--color-surface-subtle)      50%,
        var(--color-border-default)      100%
      );
      background-size: 200% 100%;
      animation: ui-skel-shimmer 1.4s ease-in-out infinite;
    }

    @keyframes ui-skel-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class SkeletonComponent {
  /** Número de linhas. Ignorado se `widths` for fornecido. */
  readonly lines  = input<number>(1);
  /** Altura de cada barra. */
  readonly height = input<string>('1rem');
  /** Largura de cada barra (substitui `lines` quando fornecido). */
  readonly widths = input<string[]>([]);
  /** Exibe as barras em linha (row) em vez de coluna. */
  readonly inline = input<boolean>(false);

  protected lineWidths(): string[] {
    const ws = this.widths();
    if (ws.length) return ws;
    // larguras decrescentes para simular texto natural
    const defaults = ['100%', '85%', '65%', '45%'];
    return Array.from({ length: this.lines() }, (_, i) => defaults[i] ?? '60%');
  }
}
