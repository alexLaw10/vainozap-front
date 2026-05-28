import { Component, input, model, output } from '@angular/core';

let _seq = 0;

/**
 * Input de CEP com máscara: 00000-000
 *
 * Emite `cepComplete` (8 dígitos puros) quando o CEP é preenchido —
 * ideal para disparar busca automática de endereço via ViaCEP.
 *
 * Uso:
 *   <app-input-cep label="CEP" [(value)]="cep" (cepComplete)="buscarEndereco($event)" />
 */
@Component({
  selector: 'app-input-cep',
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
      autocomplete="postal-code"
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
  styleUrl: './input-cep.component.scss',
})
export class InputCepComponent {
  readonly label       = input('');
  readonly placeholder = input('00000-000');
  readonly hint        = input('');
  readonly error       = input('');
  readonly disabled    = input(false);

  readonly value = model<string>('');

  /** Emitido com 8 dígitos ao completar o CEP. */
  readonly cepComplete = output<string>();

  protected readonly _uid = `ui-cep-${++_seq}`;

  protected onInput(ev: Event): void {
    const el     = ev.target as HTMLInputElement;
    const masked = this.mask(el.value);
    el.value     = masked;
    this.value.set(masked);

    const digits = masked.replace(/\D/g, '');
    if (digits.length === 8) this.cepComplete.emit(digits);
  }

  private mask(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 8);
    if (!d) return '';
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  }
}
