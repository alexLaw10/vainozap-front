import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { Produto } from '../../../../shared/models/produto.model';
import { StorefrontCartService } from '../../services/storefront-cart.service';
import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { buildDefaultCatalogCartLine } from '../../utils/default-catalog-cart-line.util';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  readonly product = input.required<Produto>();

  private readonly catalog = inject(StorefrontCatalogService);
  private readonly cart = inject(StorefrontCartService);
  private readonly context = inject(StorefrontContextService);

  protected readonly qtyInCart = computed(() => this.cart.totalQtyForProduct(this.product().id));

  /** Vem do tenant (`corDestaqueCatalogo` ou `corPrimaria`). */
  protected readonly corComprarCatalogo = computed(
    () => this.context.tenant().corDestaqueCatalogo ?? this.context.tenant().corPrimaria,
  );

  protected readonly podeComprarDireto = computed(
    () => !this.product().semEstoque && !this.isSoldOut() && buildDefaultCatalogCartLine(this.product()) !== null,
  );

  /** URL do WhatsApp para produtos sem controle de estoque (serviços). */
  protected readonly whatsappUrl = computed(() => {
    const p = this.product();
    if (!p.semEstoque) return null;
    const t = this.context.tenant();
    const phone = (t.whatsapp ?? '').replace(/\D/g, '');
    if (!phone) return null;
    const rodapeText = t.rodape?.textoLinkWhatsapp ?? 'Olá! Tenho interesse em: ';
    const msg = encodeURIComponent(`${rodapeText}${p.nome}`);
    return `https://wa.me/${phone}?text=${msg}`;
  });

  protected isSoldOut(): boolean {
    return !this.product().semEstoque && this.catalog.isProductSoldOut(this.product());
  }

  protected imageUrl(): string {
    return this.product().fotos[0] ?? '';
  }

  protected onDecQty(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.cart.decrementProduct(this.product().id);
  }

  protected onIncQty(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.cart.incrementProductFromCatalog(this.product().id);
  }

  protected comprarDireto(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    const p = this.product();
    const line = buildDefaultCatalogCartLine(p);
    if (!line) return;
    this.cart.addLine(line);
  }
}
