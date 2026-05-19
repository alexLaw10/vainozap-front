import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

import type { OrderConfirmSnapshot } from '../../models/order-confirm-snapshot.model';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-cart-order-confirm-modal',
  standalone: true,
  imports: [CurrencyPipe, IconComponent],
  templateUrl: './cart-order-confirm-modal.component.html',
  styleUrl: './cart-order-confirm-modal.component.scss',
})
export class CartOrderConfirmModalComponent {
  snap = input<OrderConfirmSnapshot | null>(null);

  close = output<void>();
  sendWhatsApp = output<void>();

  protected formatResumoData(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} - ${h}:${m}`;
  }

  protected fechar(): void {
    this.close.emit();
  }

  protected enviar(): void {
    this.sendWhatsApp.emit();
  }
}
