import { Component, input, model } from '@angular/core';

import { IconComponent } from '../../primitives/icon/icon.component';
import type { UiIconName } from '../../primitives/icon/icon.types';

let _seq = 0;

export interface RadioOption {
  value: string;
  label: string;
  /** Nome do ícone (app-icon) exibido acima do label na variante 'cards'. */
  icon?: UiIconName;
}

/**
 * Grupo de radio buttons com signal forms.
 *
 * Variante `cards` — pills em grid (ex: seletor de operação de estoque):
 *   <app-radio-group
 *     variant="cards"
 *     [options]="OPERACAO_OPTIONS"
 *     [(value)]="modalOperacao"
 *   />
 *
 * Variante `list` — lista vertical com dot estilizado:
 *   <app-radio-group
 *     label="Forma de entrega"
 *     [options]="entregaOpcoes"
 *     [(value)]="entrega"
 *   />
 */
@Component({
  selector: 'app-radio-group',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (label()) {
      <span class="group-label">{{ label() }}</span>
    }
    <div
      class="options"
      [class.options--cards]="variant() === 'cards'"
      [class.options--list]="variant() === 'list'"
    >
      @for (opt of options(); track opt.value) {
        <label
          class="option"
          [class.option--active]="value() === opt.value"
          [class.option--disabled]="disabled()"
        >
          <input
            class="native"
            type="radio"
            [name]="_name"
            [value]="opt.value"
            [checked]="value() === opt.value"
            [disabled]="disabled()"
            (change)="onChange(opt.value)"
          />
          @if (variant() === 'list') {
            <span class="dot" aria-hidden="true"></span>
          }
          @if (opt.icon) {
            <app-icon [name]="opt.icon" [size]="14" [strokeWidth]="2.5"></app-icon>
          }
          <span class="text">{{ opt.label }}</span>
        </label>
      }
    </div>
  `,
  styleUrl: './radio-group.component.scss',
})
export class RadioGroupComponent {
  readonly label    = input('');
  readonly options  = input.required<RadioOption[]>();
  readonly variant  = input<'cards' | 'list'>('list');
  readonly disabled = input(false);

  readonly value = model<string>('');

  protected readonly _name = `ui-rg-${++_seq}`;

  protected onChange(val: string): void {
    this.value.set(val);
  }
}
