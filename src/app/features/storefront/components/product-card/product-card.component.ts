import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { Produto } from '../../../../core/models/produto.model';
import { IconComponent, ToastService } from '../../../../shared/ui';
import { StorefrontCartService } from '../../services/storefront-cart.service';
import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { StorefrontWishlistService } from '../../services/storefront-wishlist.service';
import { buildDefaultCatalogCartLine } from '../../utils/default-catalog-cart-line.util';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, IconComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  readonly product  = input.required<Produto>();
  /** Modo lista — exibe card horizontal compacto. */
  readonly listMode = input(false);

  private readonly catalog   = inject(StorefrontCatalogService);
  private readonly cart      = inject(StorefrontCartService);
  private readonly context   = inject(StorefrontContextService);
  private readonly toast     = inject(ToastService);
  protected readonly wishlist = inject(StorefrontWishlistService);

  protected readonly qtyInCart = computed(() => this.cart.totalQtyForProduct(this.product().id));

  protected readonly isWishlisted = computed(() =>
    this.wishlist.isWishlisted(this.product().id),
  );

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

  /** Swatches de cor disponíveis (variação com swatch + estoque > 0). */
  protected readonly colorSwatches = computed(() => {
    const p = this.product();
    const corVar = p.variacoes.find(v => v.opcoes.some(o => o.swatch));
    if (!corVar) return null;
    const swatches = corVar.opcoes.filter(o => o.estoque > 0 && o.swatch).map(o => o.swatch!);
    return swatches.length ? swatches : null;
  });

  /** Retorna o total em estoque quando baixo (≤ 5), senão null. */
  protected readonly lowStock = computed(() => {
    const p = this.product();
    if (p.semEstoque || !p.variacoes.length) return null;
    const total = p.variacoes.flatMap(v => v.opcoes).reduce((n, o) => n + o.estoque, 0);
    return total > 0 && total <= 5 ? total : null;
  });

  protected imageUrl(): string {
    return this.product().fotos[0] ?? '';
  }

  protected toggleWishlist(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    const p = this.product();
    this.wishlist.toggle(p.id);
    const added = this.wishlist.isWishlisted(p.id);
    this.toast.show({ message: added ? `${p.nome} adicionado aos favoritos ♥` : `${p.nome} removido dos favoritos` });
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
    this.toast.show({ message: `${this.product().nome} adicionado ao carrinho` });
  }

  protected comprarDireto(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    const p = this.product();
    const line = buildDefaultCatalogCartLine(p);
    if (!line) return;
    this.cart.addLine(line);
    this.toast.show({ message: `${p.nome} adicionado ao carrinho` });
  }
}
