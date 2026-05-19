import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { type CartLine } from '../../services/storefront-cart.service';
import { cartLineTituloPrincipal, cartLineTituloVariante } from '../../utils/cart-line-title.util';

@Component({
  selector: 'app-cart-line-menu',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './cart-line-menu.component.html',
  styleUrl: './cart-line-menu.component.scss',
})
export class CartLineMenuComponent {
  line = input<CartLine | null>(null);

  close = output<void>();
  alterar = output<CartLine>();
  remover = output<CartLine>();

  protected tituloPrincipal(t: string): string {
    return cartLineTituloPrincipal(t);
  }

  protected tituloVariante(t: string): string | null {
    return cartLineTituloVariante(t);
  }

  protected fechar(): void {
    this.close.emit();
  }

  protected onAlterar(l: CartLine): void {
    this.alterar.emit(l);
  }

  protected onRemover(l: CartLine): void {
    this.remover.emit(l);
  }
}
