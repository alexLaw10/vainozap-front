import { Component, input, model, signal } from '@angular/core';

import { IconComponent } from '../../primitives/icon/icon.component';

let _seq = 0;

/**
 * Campo de senha com botão mostrar/ocultar embutido.
 *
 * Uso:
 *   <app-input-password label="Senha" [(value)]="senha" />
 *   <app-input-password label="Confirmar senha" [(value)]="confirmar" autocomplete="new-password" />
 */
@Component({
  selector: 'app-input-password',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './input-password.component.html',
  styleUrl: './input-password.component.scss',
})
export class InputPasswordComponent {
  readonly label        = input('');
  readonly placeholder  = input('••••••••');
  readonly hint         = input('');
  readonly error        = input('');
  readonly disabled     = input(false);
  readonly autocomplete = input('current-password');
  /** Sobrescreve o id auto-gerado — útil para testes e2e. */
  readonly inputId      = input<string | undefined>(undefined);

  readonly value = model<string>('');

  protected readonly _uid  = `ui-pwd-${++_seq}`;

  protected get resolvedId(): string {
    return this.inputId() ?? this._uid;
  }
  protected readonly show  = signal(false);

  protected toggle(): void {
    this.show.update((v) => !v);
  }

  protected onInput(ev: Event): void {
    this.value.set((ev.target as HTMLInputElement).value);
  }
}
