import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

import { UiButtonVariant } from './button.types';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      class="ui-button"
      [ngClass]="[
        'ui-button--' + variant(),
        inline() ? 'ui-button--inline' : ''
      ]"
      [attr.type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading()"
    >
      @if (loading()) {
        <span class="ui-button__spinner" aria-hidden="true"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly variant = input<UiButtonVariant>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly inline = input(false);
}
