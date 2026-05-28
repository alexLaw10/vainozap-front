import { Component, input, model } from '@angular/core';

let _seq = 0;

/**
 * Input de CNPJ com máscara: 00.000.000/0001-00
 *
 * Uso:
 *   <app-input-cnpj label="CNPJ" [(value)]="cnpj" [error]="cnpjError()" />
 */
@Component({
  selector: 'app-input-cnpj',
  standalone: true,
  template: `
    @if (label()) {
      <label class="label" [for]="_uid">{{ label() }}</label>
    }
    <input
      class="control"
      [class.is-error]="error()"
      type="text"
      [id]="_uid"
      [placeholder]="placeholder()"
      autocomplete="off"
      inputmode="numeric"
      [disabled]="disabled()"
      [value]="value()"
      (input)="onInput($event)"
    />
    @if (error()) {
      <span class="msg msg--error" role="alert">{{ error() }}</span>
    } @else if (hint()) {
      <span class="msg">{{ hint() }}</span>
    }
  `,
  styleUrl: './input-cnpj.component.scss',
})
export class InputCnpjComponent {
  readonly label       = input('');
  readonly placeholder = input('00.000.000/0001-00');
  readonly hint        = input('');
  readonly error       = input('');
  readonly disabled    = input(false);

  readonly value = model<string>('');

  protected readonly _uid = `ui-cnpj-${++_seq}`;

  protected onInput(ev: Event): void {
    const el     = ev.target as HTMLInputElement;
    const masked = this.mask(el.value);
    el.value     = masked;
    this.value.set(masked);
  }

  private mask(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 14);
    if (!d) return '';
    if (d.length <= 2)  return d;
    if (d.length <= 5)  return `${d.slice(0, 2)}.${d.slice(2)}`;
    if (d.length <= 8)  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
}
