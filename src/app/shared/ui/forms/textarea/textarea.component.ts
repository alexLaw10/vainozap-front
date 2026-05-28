import { Component, input, model } from '@angular/core';

let _seq = 0;

/**
 * Textarea com signal forms.
 *
 * Uso:
 *   <app-textarea label="Descrição" [(value)]="descricao" [rows]="5" />
 */
@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
})
export class TextareaComponent {
  readonly label       = input('');
  readonly placeholder = input('');
  readonly hint        = input('');
  readonly error       = input('');
  readonly rows        = input(4);
  readonly maxlength   = input<number | undefined>(undefined);
  readonly disabled    = input(false);
  readonly inputId     = input<string | undefined>(undefined);

  readonly value = model<string>('');

  protected readonly _uid = `ui-textarea-${++_seq}`;

  protected get resolvedId(): string {
    return this.inputId() ?? this._uid;
  }

  protected onInput(ev: Event): void {
    this.value.set((ev.target as HTMLTextAreaElement).value);
  }
}
