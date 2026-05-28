import { Component, input, model } from '@angular/core';

let _seq = 0;

/**
 * Checkbox estilizado com signal forms.
 *
 * Uso:
 *   <app-checkbox label="Aceito os termos" [(value)]="aceito" />
 *   <app-checkbox [(value)]="selecionado" />
 */
@Component({
  selector: 'app-checkbox',
  standalone: true,
  template: `
    <label class="wrap" [class.wrap--disabled]="disabled()">
      <input
        class="native"
        type="checkbox"
        [id]="_uid"
        [checked]="value()"
        [disabled]="disabled()"
        (change)="onChange($event)"
      />
      <span class="box" aria-hidden="true">
        <svg class="check" viewBox="0 0 12 10" fill="none" aria-hidden="true">
          <polyline
            points="1.5,5 5,8.5 10.5,1.5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      @if (label()) {
        <span class="text">{{ label() }}</span>
      }
    </label>
  `,
  styleUrl: './checkbox.component.scss',
})
export class CheckboxComponent {
  readonly label    = input('');
  readonly disabled = input(false);

  readonly value = model<boolean>(false);

  protected readonly _uid = `ui-checkbox-${++_seq}`;

  protected onChange(ev: Event): void {
    this.value.set((ev.target as HTMLInputElement).checked);
  }
}
