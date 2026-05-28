import { Component, input, model } from '@angular/core';

let _seq = 0;

/**
 * Input de cor: picker nativo + campo de texto hex sincronizados.
 *
 * Uso:
 *   <app-input-color label="Cor primária" [(value)]="corPrimaria" />
 *
 * O valor é sempre uma string hex (#rrggbb).
 */
@Component({
  selector: 'app-input-color',
  standalone: true,
  template: `
    @if (label()) {
      <label class="label" [for]="_uid">{{ label() }}</label>
    }
    <div class="wrap">
      <input
        class="picker"
        type="color"
        [value]="value()"
        [disabled]="disabled()"
        (input)="onInput($event)"
        aria-hidden="true"
        tabindex="-1"
      />
      <input
        class="control"
        [class.is-error]="error()"
        type="text"
        [id]="_uid"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="value()"
        (input)="onInput($event)"
        maxlength="7"
        spellcheck="false"
      />
    </div>
    @if (error()) {
      <span class="msg msg--error" role="alert">{{ error() }}</span>
    } @else if (hint()) {
      <span class="msg">{{ hint() }}</span>
    }
  `,
  styleUrl: './input-color.component.scss',
})
export class InputColorComponent {
  readonly label       = input('');
  readonly placeholder = input('#000000');
  readonly hint        = input('');
  readonly error       = input('');
  readonly disabled    = input(false);

  readonly value = model<string>('#000000');

  protected readonly _uid = `ui-color-${++_seq}`;

  protected onInput(ev: Event): void {
    const val = (ev.target as HTMLInputElement).value;
    this.value.set(val);
  }
}
