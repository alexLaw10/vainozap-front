import { Component, input } from '@angular/core';

/**
 * Tooltip informativo — círculo "?" com balão ao hover/focus.
 *
 * Uso:
 * ```html
 * <ui-tooltip text="Explica o campo" />
 * ```
 */
@Component({
  selector: 'ui-tooltip',
  standalone: true,
  template: `
    <span class="ui-tooltip" [attr.aria-label]="text()" tabindex="0">
      ?
      <span class="ui-tooltip__bubble" role="tooltip">{{ text() }}</span>
    </span>
  `,
  styleUrl: './tooltip.component.scss',
})
export class TooltipComponent {
  text = input.required<string>();
}
