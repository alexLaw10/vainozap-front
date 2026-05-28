import { CurrencyPipe } from '@angular/common';
import { afterNextRender, Component, computed, DestroyRef, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { startWith, switchMap } from 'rxjs/operators';

import type { Produto, Variacao, VariacaoTipoUi } from '../../../../core/models/produto.model';
import { IconComponent, ToastService } from '@app/shared/ui';
import { StorefrontCartService } from '../../services/storefront-cart.service';
import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { StorefrontRecentlyViewedService } from '../../services/storefront-recently-viewed.service';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { resolveVariacaoTipo, sortVariacoesParaFicha } from '../../utils/variacao-ui.util';

type ProductState = { status: 'loading' } | { status: 'found'; product: Produto } | { status: 'not-found' };

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, IconComponent, ProductCardComponent],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.scss',
})
export class ProductPageComponent {
  private readonly route          = inject(ActivatedRoute);
  protected readonly router       = inject(Router);
  private readonly catalog        = inject(StorefrontCatalogService);
  private readonly cart           = inject(StorefrontCartService);
  protected readonly context      = inject(StorefrontContextService);
  private readonly toast          = inject(ToastService);
  private readonly recentlyViewed = inject(StorefrontRecentlyViewedService);
  private readonly metaService = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly destroyRef  = inject(DestroyRef);

  private readonly ctaAnchor = viewChild<ElementRef>('ctaAnchor');
  protected readonly ctaInView = signal(true);

  protected readonly state = toSignal<ProductState>(
    this.route.paramMap.pipe(
      switchMap((pm) => {
        const id = pm.get('productId') ?? '';
        return this.catalog.getProduct(id).pipe(
          switchMap(async (p): Promise<ProductState> =>
            p ? { status: 'found', product: p } : { status: 'not-found' },
          ),
          startWith<ProductState>({ status: 'loading' }),
        );
      }),
    ),
    { requireSync: false },
  );

  protected readonly product = computed<Produto | null>(() => {
    const s = this.state();
    return s?.status === 'found' ? s.product : null;
  });

  protected readonly category = computed(() => {
    const p = this.product();
    if (!p) return null;
    return this.catalog.listCategories().find(c => c.id === p.categoriaId) ?? null;
  });

  protected readonly relatedProducts = computed(() => {
    const p = this.product();
    if (!p) return [];
    return this.catalog.listProducts()
      .filter(x => x.ativo && x.categoriaId === p.categoriaId && x.id !== p.id)
      .slice(0, 4);
  });

  protected readonly mainPhotoIndex    = signal(0);
  protected readonly lightboxIndex     = signal<number | null>(null);
  protected readonly photoLightboxOpen = signal(false);
  protected readonly qrModalOpen       = signal(false);

  // ── Swipe mobile na galeria ──────────────────────────────────────────────
  private swipeTouchStartX = 0;

  protected onHeroTouchStart(ev: TouchEvent): void {
    this.swipeTouchStartX = ev.changedTouches[0]?.clientX ?? 0;
  }

  protected onHeroTouchEnd(ev: TouchEvent): void {
    const p = this.product();
    if (!p || p.fotos.length <= 1) return;
    const endX  = ev.changedTouches[0]?.clientX ?? 0;
    const delta = endX - this.swipeTouchStartX;
    if (Math.abs(delta) < 45) return;           // limiar mínimo
    if (delta < 0) this.nextPhoto();
    else           this.prevPhoto();
  }
  protected readonly quantity = signal(1);
  protected readonly observacao = signal('');
  protected readonly selectedOpcaoPorVariacao = signal<Record<string, string>>({});
  protected readonly selectedStock = computed<number | null>(() => {
    const p = this.product();
    if (!p || p.variacoes.length === 0) return null;

    let stock = Number.POSITIVE_INFINITY;
    for (const v of p.variacoes) {
      const oid = this.selectedOpcaoPorVariacao()[v.id];
      const op = v.opcoes.find((o) => o.id === oid);
      if (!op) return 0;
      stock = Math.min(stock, op.estoque);
    }
    return Number.isFinite(stock) ? stock : 0;
  });

  constructor() {
    // Reset estado ao mudar produto + OG meta tags
    effect(() => {
      const p = this.product();
      const t = this.context.tenant();
      untracked(() => {
        this.mainPhotoIndex.set(0);
        this.quantity.set(1);
        this.observacao.set('');
        if (!p) {
          this.selectedOpcaoPorVariacao.set({});
          this.titleService.setTitle(t.nomeLoja);
          this.metaService.removeTag('property="og:title"');
          this.metaService.removeTag('property="og:description"');
          this.metaService.removeTag('property="og:image"');
          return;
        }
        const sel: Record<string, string> = {};
        for (const v of this.sortVariacoes(p)) {
          const firstInStock = v.opcoes.find((o) => o.estoque > 0);
          const pick = firstInStock ?? v.opcoes[0];
          if (pick) sel[v.id] = pick.id;
        }
        this.selectedOpcaoPorVariacao.set(sel);

        // Registra visita recente
        this.recentlyViewed.track(p.id);

        // OG / WhatsApp preview
        const pageTitle = `${p.nome} — ${t.nomeLoja}`;
        this.titleService.setTitle(pageTitle);
        this.metaService.updateTag({ property: 'og:title',       content: p.nome });
        this.metaService.updateTag({ property: 'og:description', content: p.descricao?.slice(0, 200) ?? '' });
        this.metaService.updateTag({ property: 'og:image',       content: p.fotos[0] ?? '' });
        this.metaService.updateTag({ property: 'og:type',        content: 'product' });
        if (typeof location !== 'undefined') {
          this.metaService.updateTag({ property: 'og:url', content: location.href });
        }
      });
    });

    // Sticky CTA — IntersectionObserver no âncora do botão principal
    afterNextRender(() => {
      const el = this.ctaAnchor()?.nativeElement;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => this.ctaInView.set(entry.isIntersecting),
        { threshold: 0 }
      );
      obs.observe(el);
      this.destroyRef.onDestroy(() => obs.disconnect());
    });
  }

  protected sortVariacoes(p: Produto): Variacao[] {
    return sortVariacoesParaFicha(p);
  }

  protected tipoVariacao(v: Variacao): VariacaoTipoUi {
    return resolveVariacaoTipo(v);
  }

  protected mainImageSrc(): string {
    const p = this.product();
    if (!p?.fotos.length) return '';
    const i = Math.min(this.mainPhotoIndex(), p.fotos.length - 1);
    return p.fotos[i] ?? '';
  }

  protected selectThumb(i: number): void { this.mainPhotoIndex.set(i); }
  protected isThumbActive(i: number): boolean { return this.mainPhotoIndex() === i; }

  protected openVideo(i: number): void    { this.lightboxIndex.set(i); }
  protected closeLightbox(): void          { this.lightboxIndex.set(null); }
  protected openPhotoLightbox(): void      { this.photoLightboxOpen.set(true); }
  protected closePhotoLightbox(): void     { this.photoLightboxOpen.set(false); }
  protected openQrModal(): void            { this.qrModalOpen.set(true); }
  protected closeQrModal(): void           { this.qrModalOpen.set(false); }

  /** URL da imagem QR Code gerada externamente (sem lib). */
  protected qrImageUrl(): string {
    if (typeof location === 'undefined') return '';
    const data = encodeURIComponent(location.href);
    return `https://api.qrserver.com/v1/create-qr-code/?data=${data}&size=200x200&margin=12&bgcolor=ffffff&color=000000`;
  }

  protected prevPhoto(): void {
    const p = this.product();
    if (!p) return;
    const i = this.mainPhotoIndex();
    this.mainPhotoIndex.set(i === 0 ? p.fotos.length - 1 : i - 1);
  }

  protected nextPhoto(): void {
    const p = this.product();
    if (!p) return;
    const i = this.mainPhotoIndex();
    this.mainPhotoIndex.set(i === p.fotos.length - 1 ? 0 : i + 1);
  }

  protected selectOpcao(p: Produto, variacaoId: string, opcaoId: string): void {
    const v = p.variacoes.find((x) => x.id === variacaoId);
    const op = v?.opcoes.find((o) => o.id === opcaoId);
    if (!op || op.estoque <= 0) return;
    this.selectedOpcaoPorVariacao.update((m) => ({ ...m, [variacaoId]: opcaoId }));
  }

  /** URL `wa.me` para produtos sem estoque (serviços/consultoria). */
  protected readonly whatsappUrl = computed<string | null>(() => {
    const p = this.product();
    if (!p?.semEstoque) return null;
    const t = this.context.tenant();
    const phone = (t.whatsapp ?? '').replace(/\D/g, '');
    if (!phone) return null;
    const msg = encodeURIComponent(
      `Olá! 👋 Vim pelo catálogo da *${t.nomeLoja}* e tenho interesse em *${p.nome}*.\n\n` +
      `Poderia me passar mais informações sobre disponibilidade, valor e condições?\n\n` +
      `Aguardo seu retorno. Obrigado! 😊`
    );
    return `https://wa.me/${phone}?text=${msg}`;
  });

  /** URL `wa.me` para o link "Falar com o vendedor" (qualquer produto). */
  protected readonly whatsappSellerUrl = computed<string | null>(() => {
    const p = this.product();
    if (!p) return null;
    const t = this.context.tenant();
    const phone = (t.whatsapp ?? '').replace(/\D/g, '');
    if (!phone) return null;
    const msg = encodeURIComponent(`Olá! Tenho uma dúvida sobre: ${p.nome}`);
    return `https://wa.me/${phone}?text=${msg}`;
  });

  protected contactSeller(): void {
    const url = this.whatsappSellerUrl();
    if (url && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  protected isOpcaoSelected(v: Variacao, opcaoId: string): boolean {
    return (this.selectedOpcaoPorVariacao()[v.id] ?? '') === opcaoId;
  }

  protected onQuantityInput(ev: Event): void {
    const raw = Number((ev.target as HTMLInputElement).value);
    if (!Number.isFinite(raw) || raw < 1) return;
    const maxStock = this.selectedStock();
    const maxAllowed = maxStock === null ? 999 : Math.max(1, maxStock);
    this.quantity.set(Math.min(maxAllowed, Math.floor(raw)));
  }

  protected onObsInput(ev: Event): void {
    this.observacao.set((ev.target as HTMLInputElement).value);
  }

  protected lineTotal(): number {
    const p = this.product();
    if (!p) return 0;
    let extra = 0;
    for (const v of p.variacoes) {
      const oid = this.selectedOpcaoPorVariacao()[v.id];
      const op = v.opcoes.find((o) => o.id === oid);
      extra += op?.precoExtra ?? 0;
    }
    return (p.preco + extra) * this.quantity();
  }

  protected selectionHasStock(): boolean {
    const p = this.product();
    if (!p) return false;
    if (p.variacoes.length === 0) return true;
    for (const v of p.variacoes) {
      const oid = this.selectedOpcaoPorVariacao()[v.id];
      const op = v.opcoes.find((o) => o.id === oid);
      if (!op || op.estoque <= 0) return false;
    }
    return true;
  }

  protected async share(): Promise<void> {
    const p = this.product();
    if (!p || typeof location === 'undefined') return;
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: p.nome, text: p.descricao, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch { /* cancelado */ }
  }

  /** Compartilha o produto diretamente no WhatsApp com nome, preço e link. */
  protected shareWhatsApp(): void {
    const p = this.product();
    if (!p || typeof location === 'undefined') return;
    const t    = this.context.tenant();
    const preco = p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const text  = `*${p.nome}*\n${preco} — ${t.nomeLoja}\n\n${location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  protected addToCart(): void {
    const p = this.product();
    if (!p || !this.selectionHasStock()) return;

    let extraPorUnidade = 0;
    for (const v of p.variacoes) {
      const oid = this.selectedOpcaoPorVariacao()[v.id];
      const op = v.opcoes.find((o) => o.id === oid);
      extraPorUnidade += op?.precoExtra ?? 0;
    }
    const precoUnit = p.preco + extraPorUnidade;

    const partes: string[] = [];
    for (const v of p.variacoes) {
      const oid = this.selectedOpcaoPorVariacao()[v.id];
      const op = v.opcoes.find((o) => o.id === oid);
      if (op) partes.push(op.valor);
    }
    const titulo = partes.length ? `${p.nome} — ${partes.join(' · ')}` : p.nome;

    this.cart.addLine({ productId: p.id, titulo, quantidade: this.quantity(), precoUnit, thumbUrl: p.fotos[0] });

    // Feedback visual — não navega; o usuário pode continuar escolhendo produtos
    this.toast.show({
      message:     `${p.nome} adicionado`,
      actionLabel: 'Ver pedido →',
      actionRoute: '/cart',
    });
  }
}
