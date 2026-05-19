import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="ui-modal-backdrop" (click)="closed.emit()"></div>
      <div
        class="ui-modal"
        [class.ui-modal--wide]="wide()"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title() || null"
      >
        <header class="ui-modal__head">
          <h2 class="ui-modal__title">{{ title() }}</h2>
          <button type="button" class="ui-modal__close" aria-label="Fechar" (click)="closed.emit()">✕</button>
        </header>
        <div class="ui-modal__content">
          <ng-content></ng-content>
        </div>
      </div>
    }
  `,
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  readonly open = input(false);
  readonly wide = input(false);
  readonly title = input('');
  readonly closed = output<void>();
}
