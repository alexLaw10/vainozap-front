import { Component, input, model } from '@angular/core';

let _seq = 0;

/**
 * Input CPF/CNPJ com troca automática de máscara.
 *
 * CPF  (≤ 11 dígitos): 000.000.000-00
 * CNPJ (12–14 dígitos): 00.000.000/0001-00
 *
 * Uso:
 *   <app-input-cpf-cnpj label="CPF / CNPJ" [(value)]="cpfCnpj" />
 */
@Component({
  selector: 'app-input-cpf-cnpj',
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
  styleUrl: './input-cpf-cnpj.component.scss',
})
export class InputCpfCnpjComponent {
  readonly label       = input('');
  readonly placeholder = input('CPF ou CNPJ');
  readonly hint        = input('');
  readonly error       = input('');
  readonly disabled    = input(false);

  readonly value = model<string>('');

  protected readonly _uid = `ui-cpfcnpj-${++_seq}`;

  protected onInput(ev: Event): void {
    const el     = ev.target as HTMLInputElement;
    const masked = this.mask(el.value);
    el.value     = masked;
    this.value.set(masked);
  }

  private mask(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 14);
    if (!d) return '';
    return d.length <= 11 ? this.maskCpf(d) : this.maskCnpj(d);
  }

  private maskCpf(d: string): string {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  private maskCnpj(d: string): string {
    if (d.length <= 2)  return d;
    if (d.length <= 5)  return `${d.slice(0, 2)}.${d.slice(2)}`;
    if (d.length <= 8)  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
}
