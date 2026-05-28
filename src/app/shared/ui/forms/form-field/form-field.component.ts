import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  standalone: true,
  template: `
    <label class="ui-form-field">
      <span class="ui-form-field__label">{{ label() }}</span>
      <ng-content></ng-content>
      @if (hint()) {
        <span class="ui-form-field__hint">{{ hint() }}</span>
      }
      @if (error()) {
        <span class="ui-form-field__error">{{ error() }}</span>
      }
    </label>
  `,
  styleUrl: './form-field.component.scss',
})
export class FormFieldComponent {
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly error = input('');
}
