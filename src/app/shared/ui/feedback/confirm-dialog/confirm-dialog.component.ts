import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <div class="ui-confirm-backdrop" (click)="cancel.emit()"></div>
      <div class="ui-confirm" role="alertdialog" aria-modal="true" [attr.aria-label]="title() || 'Confirmar ação'">
        @if (title()) {
          <h3 class="ui-confirm__title">{{ title() }}</h3>
        }
        <p class="ui-confirm__text">{{ message() }}</p>
        <div class="ui-confirm__actions">
          <button type="button" class="ui-confirm__btn ui-confirm__btn--ghost" (click)="cancel.emit()">{{ cancelLabel() }}</button>
          <button type="button" class="ui-confirm__btn ui-confirm__btn--danger" (click)="confirm.emit()">{{ confirmLabel() }}</button>
        </div>
      </div>
    }
  `,
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly message = input.required<string>();
  readonly cancelLabel = input('Cancelar');
  readonly confirmLabel = input('Confirmar');

  readonly cancel = output<void>();
  readonly confirm = output<void>();
}
