import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ToastService } from './toast.service';

/**
 * Toast de feedback global.
 *
 * Coloque UMA instância no shell do contexto desejado (storefront, merchant…):
 *
 * ```html
 * <ui-toast />
 * ```
 *
 * Dispare via injeção do `ToastService`:
 * ```ts
 * toast.show({ message: 'Salvo!', actionLabel: 'Ver →', actionRoute: '/cart' });
 * ```
 */
@Component({
  selector: 'ui-toast',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './toast.component.html',
  styleUrl:    './toast.component.scss',
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);
}
