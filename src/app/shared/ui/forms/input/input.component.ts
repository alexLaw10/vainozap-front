import { Component, input, model } from '@angular/core';

let _seq = 0;

/**
 * Campo de texto genérico com signal forms.
 *
 * Uso:
 *   <app-input label="Nome" [(value)]="nome" placeholder="ex.: João" />
 *   <app-input type="email"    label="E-mail"  [(value)]="email"  [error]="emailError()" />
 *   <app-input type="password" label="Senha"   [(value)]="senha"  />
 *   <app-input type="number"   label="Preço"   [(value)]="preco"  />
 *   <app-input [clearable]="true" label="Busca" [(value)]="query" />
 */
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent {
  // ── Configuração ────────────────────────────────────────────────────────────
  readonly label        = input('');
  readonly type         = input('text');
  readonly placeholder  = input('');
  readonly hint         = input('');
  readonly error        = input('');
  readonly disabled     = input(false);
  readonly autocomplete = input('off');
  readonly required     = input(false);
  readonly inputmode    = input<string | undefined>(undefined);
  readonly clearable    = input(false);
  /** Sobrescreve o id auto-gerado. */
  readonly inputId      = input<string | undefined>(undefined);

  // ── Valor (two-way binding via signal) ──────────────────────────────────────
  readonly value = model<string>('');

  /** ID único para associar label ↔ input (acessibilidade). */
  protected readonly _uid = `ui-input-${++_seq}`;

  protected get resolvedId(): string {
    return this.inputId() ?? this._uid;
  }

  protected onInput(ev: Event): void {
    this.value.set((ev.target as HTMLInputElement).value);
  }

  protected clear(): void {
    this.value.set('');
  }
}
