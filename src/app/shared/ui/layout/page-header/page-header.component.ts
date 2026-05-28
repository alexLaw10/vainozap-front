import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="ui-page-header">
      <div>
        <h1 class="ui-page-header__title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="ui-page-header__sub">{{ subtitle() }}</p>
        }
      </div>
      <div class="ui-page-header__actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
