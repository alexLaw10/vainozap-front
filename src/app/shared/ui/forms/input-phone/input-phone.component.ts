import { Component, input, model } from '@angular/core';

let _seq = 0;

/**
 * Input de telefone brasileiro com máscara progressiva.
 *
 * Celular:  (11) 9 9999-9999
 * Fixo:     (11) 9999-9999
 *
 * Uso:
 *   <app-input-phone label="WhatsApp" [(value)]="whatsapp" />
 *
 * Para obter só os dígitos: value().replace(/\D/g, '')
 */
@Component({
  selector: 'app-input-phone',
  standalone: true,
  template: `
    @if (label()) {
      <label class="label" [for]="resolvedId">{{ label() }}</label>
    }
    <input
      class="control"
      [class.is-error]="error()"
      type="tel"
      [id]="resolvedId"
      [placeholder]="placeholder()"
      autocomplete="tel"
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
  styleUrl: './input-phone.component.scss',
})
export class InputPhoneComponent {
  readonly label       = input('');
  readonly placeholder = input('(11) 9 9999-9999');
  readonly hint        = input('');
  readonly error       = input('');
  readonly disabled    = input(false);
  readonly inputId     = input<string | undefined>(undefined);

  protected get resolvedId(): string { return this.inputId() ?? this._uid; }

  readonly value = model<string>('');

  protected readonly _uid = `ui-phone-${++_seq}`;

  protected onInput(ev: Event): void {
    const el     = ev.target as HTMLInputElement;
    const masked = this.mask(el.value);
    el.value     = masked;
    this.value.set(masked);
  }

  /**
   * Máscara progressiva — aceita entrada com ou sem código do país (+55 / 55).
   * 10 dígitos → fixo: (XX) XXXX-XXXX
   * 11 dígitos → celular: (XX) X XXXX-XXXX
   */
  private mask(raw: string): string {
    let d = raw.replace(/\D/g, '');
    if (d.startsWith('55') && d.length > 11) d = d.slice(2);
    d = d.slice(0, 11);

    if (!d) return '';
    if (d.length <= 2)  return `(${d}`;
    if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
  }
}
