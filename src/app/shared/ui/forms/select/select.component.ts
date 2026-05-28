import { Component, input, model } from '@angular/core';

let _seq = 0;

/** Par de opção passado via `[options]`. */
export interface SelectOption {
  label: string;
  value: string;
}

/**
 * Select estilizado com signal forms.
 *
 * Uso básico (array de opções):
 *   <app-select label="Categoria" placeholder="Selecione…"
 *               [options]="cats" [(value)]="categoriaId" />
 *
 * Variante "pill" (vitrine):
 *   <app-select [pill]="true" [options]="opts" [(value)]="val" />
 */
@Component({
  selector: 'app-select',
  standalone: true,
  imports: [],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
})
export class SelectComponent {
  readonly label       = input('');
  readonly hint        = input('');
  readonly error       = input('');
  readonly disabled    = input(false);
  readonly inputId     = input<string | undefined>(undefined);
  /** Lista de opções renderizada internamente pelo componente. */
  readonly options     = input<readonly SelectOption[]>([]);
  /** Rótulo da opção vazia exibida no topo (ex.: "Sem categoria"). */
  readonly placeholder = input('');
  /** Aplica estilo "pill" (border-radius full) — usado na vitrine. */
  readonly pill        = input(false);

  readonly value = model<string>('');

  protected readonly _uid = `ui-select-${++_seq}`;

  protected get resolvedId(): string {
    return this.inputId() ?? this._uid;
  }

  protected onChange(ev: Event): void {
    this.value.set((ev.target as HTMLSelectElement).value);
  }
}
