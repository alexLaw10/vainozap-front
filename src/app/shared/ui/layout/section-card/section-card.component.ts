import { Component, input } from '@angular/core';

/**
 * Card de seção com título eyebrow opcional e slot de conteúdo.
 *
 * @example
 * <app-section-card title="Cliente">
 *   <dl>...</dl>
 * </app-section-card>
 *
 * <app-section-card> <!-- sem título -->
 *   <p>conteúdo livre</p>
 * </app-section-card>
 */
@Component({
  selector: 'app-section-card',
  standalone: true,
  template: `
    <section class="sc">
      @if (title()) {
        <h2 class="sc__title">{{ title() }}</h2>
      }
      <div class="sc__body">
        <ng-content />
      </div>
    </section>
  `,
  styleUrl: './section-card.component.scss',
})
export class SectionCardComponent {
  /** Eyebrow label exibido acima do conteúdo. Omita para card sem cabeçalho. */
  readonly title = input<string>('');
}
