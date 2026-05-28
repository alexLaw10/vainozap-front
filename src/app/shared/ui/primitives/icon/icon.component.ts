import { Component, computed, input } from '@angular/core';

import { UI_ICON_REGISTRY } from './icon.registry';
import { UiIconName } from './icon.types';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <span class="ui-icon" [attr.aria-hidden]="ariaLabel() ? null : 'true'" [attr.aria-label]="ariaLabel() || null">
      <svg
        class="ui-icon__svg"
        [attr.viewBox]="definition().viewBox"
        [attr.width]="size()"
        [attr.height]="size()"
        [attr.stroke-width]="strokeWidth()"
        [attr.fill]="definition().filled ? 'currentColor' : 'none'"
        [attr.stroke]="definition().filled ? 'none' : 'currentColor'"
        [attr.stroke-linecap]="definition().filled ? null : 'round'"
        [attr.stroke-linejoin]="definition().filled ? null : 'round'"
      >
        <path [attr.d]="definition().path"></path>
      </svg>
    </span>
  `,
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  readonly name = input.required<UiIconName>();
  readonly size = input<number>(16);
  readonly strokeWidth = input<number>(2);
  readonly ariaLabel = input<string | null>(null);

  protected readonly definition = computed(() => UI_ICON_REGISTRY[this.name()]);
}
