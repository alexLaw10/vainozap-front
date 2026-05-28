import { Component, input, model, output } from '@angular/core';

import { IconComponent } from '../../primitives/icon/icon.component';

let _seq = 0;

/**
 * Input de busca com ícone de lupa e spinner de loading.
 *
 * Uso:
 *   <app-input-search
 *     label="Buscar produto"
 *     placeholder="Digite para buscar…"
 *     [(value)]="query"
 *     [loading]="searching()"
 *     (search)="onSearch($event)"
 *   />
 *
 * O output `search` emite a string digitada a cada keystroke.
 * Use debounce no componente pai quando necessário.
 */
@Component({
  selector: 'app-input-search',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (label()) {
      <label class="label" [for]="_uid">{{ label() }}</label>
    }
    <div class="wrap" [class.is-error]="error()" [class.is-disabled]="disabled()">
      <app-icon class="wrap__icon" name="search" [size]="16" [strokeWidth]="2"></app-icon>
      <input
        class="control"
        type="search"
        [id]="_uid"
        [placeholder]="placeholder()"
        autocomplete="off"
        [disabled]="disabled()"
        [value]="value()"
        (input)="onInput($event)"
      />
      @if (loading()) {
        <span class="wrap__spinner" aria-hidden="true"></span>
      }
    </div>
    @if (error()) {
      <span class="msg msg--error" role="alert">{{ error() }}</span>
    } @else if (hint()) {
      <span class="msg">{{ hint() }}</span>
    }
  `,
  styleUrl: './input-search.component.scss',
})
export class InputSearchComponent {
  readonly label       = input('');
  readonly placeholder = input('Buscar…');
  readonly hint        = input('');
  readonly error       = input('');
  readonly disabled    = input(false);
  readonly loading     = input(false);

  readonly value  = model<string>('');
  readonly search = output<string>();

  protected readonly _uid = `ui-search-${++_seq}`;

  protected onInput(ev: Event): void {
    const val = (ev.target as HTMLInputElement).value;
    this.value.set(val);
    this.search.emit(val);
  }
}
