import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { StorefrontCartService, type CartLine } from '../../services/storefront-cart.service';
import { StorefrontCouponService } from '../../services/storefront-coupon.service';
import type { EntregaModo } from '../../models/entrega-checkout.model';
import { IconComponent, TextareaComponent } from '@app/shared/ui';

@Component({
  selector: 'app-cart-order-summary',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, FormsModule, IconComponent, TextareaComponent],
  templateUrl: './cart-order-summary.component.html',
  styleUrl: './cart-order-summary.component.scss',
})
export class CartOrderSummaryComponent {
  protected readonly cart   = inject(StorefrontCartService);
  protected readonly coupon = inject(StorefrontCouponService);

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

  protected readonly couponInput = signal('');

  protected readonly totalComDesconto = computed(() =>
    Math.max(0, this.cart.subtotal() - this.coupon.desconto())
  );

  protected onEscolherEntrega(m: EntregaModo): void {
    this.entregaChange.emit(m);
  }

  protected abrirMenuItem(l: CartLine, ev: Event): void {
    this.itemMenuOpen.emit({ line: l, event: ev });
  }

  protected aplicarCupom(): void {
    if (!this.couponInput().trim()) return;
    this.coupon.validar(this.couponInput().trim(), this.cart.subtotal());
  }
}
