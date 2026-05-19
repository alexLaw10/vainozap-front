import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';

export interface UiSegmentedOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-segmented-control',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="ui-seg" role="group">
      @for (opt of options(); track opt.value) {
        <button
          type="button"
          class="ui-seg__btn"
          [ngClass]="{ 'ui-seg__btn--active': value() === opt.value }"
          (click)="valueChange.emit(opt.value)"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './segmented-control.component.scss',
})
export class SegmentedControlComponent {
  readonly options = input.required<UiSegmentedOption[]>();
  readonly value = input.required<string>();
  readonly valueChange = output<string>();
}
