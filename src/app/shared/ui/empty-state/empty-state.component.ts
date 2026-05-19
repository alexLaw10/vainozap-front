import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <section class="ui-empty">
      <h3 class="ui-empty__title">{{ title() }}</h3>
      @if (description()) {
        <p class="ui-empty__desc">{{ description() }}</p>
      }
      <ng-content></ng-content>
    </section>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input('');
}
