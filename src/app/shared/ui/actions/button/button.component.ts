import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

import { ButtonBase } from './button-base';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      class="ui-button"
      [ngClass]="[
        'ui-button--' + variant(),
        size() === 'sm' ? 'ui-button--sm' : '',
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
export class ButtonComponent extends ButtonBase {}
