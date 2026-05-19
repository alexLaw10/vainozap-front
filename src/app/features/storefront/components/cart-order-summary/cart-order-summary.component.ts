import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StorefrontCartService, type CartLine } from '../../services/storefront-cart.service';
import type { EntregaModo } from '../../models/entrega-checkout.model';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';

@Component({
  selector: 'app-cart-order-summary',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, IconComponent],
  templateUrl: './cart-order-summary.component.html',
  styleUrl: './cart-order-summary.component.scss',
})
export class CartOrderSummaryComponent {
  protected readonly cart = inject(StorefrontCartService);
  entrega = input.required<EntregaModo>();
  observacoes = input.required<string>();
  podeFinalizar = input.required<boolean>();
  itemMenuLine = input<CartLine | null>(null);

  shareClick = output<void>();
  itemMenuOpen = output<{ line: CartLine; event: Event }>();
  entregaChange = output<EntregaModo>();
  observacoesChange = output<string>();
  finalizarClick = output<void>();
  falarVendedorClick = output<void>();

  protected onEscolherEntrega(m: EntregaModo): void {
    this.entregaChange.emit(m);
  }

  protected onObs(ev: Event): void {
    this.observacoesChange.emit((ev.target as HTMLTextAreaElement).value);
  }

  protected abrirMenuItem(l: CartLine, ev: Event): void {
    this.itemMenuOpen.emit({ line: l, event: ev });
  }
}
