import { Component, input, model } from '@angular/core';

let _seq = 0;

/**
 * Toggle (switch) com signal forms.
 *
 * Uso:
 *   <app-toggle label="Ativo" [(value)]="ativo" />
 *   <app-toggle [(value)]="aceitaEntrega" />
 */
@Component({
  selector: 'app-toggle',
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
      <span class="track" aria-hidden="true">
        <span class="thumb"></span>
      </span>
      @if (label()) {
        <span class="text">
          {{ label() }}
          @if (hint()) {
            <span class="hint">{{ hint() }}</span>
          }
        </span>
      }
    </label>
  `,
  styleUrl: './toggle.component.scss',
})
export class ToggleComponent {
  readonly label    = input('');
  readonly hint     = input('');
  readonly disabled = input(false);

  readonly value = model<boolean>(false);

  protected readonly _uid = `ui-toggle-${++_seq}`;

  protected onChange(ev: Event): void {
    this.value.set((ev.target as HTMLInputElement).checked);
  }
}
