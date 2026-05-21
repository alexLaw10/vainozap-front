import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { startWith, switchMap } from 'rxjs/operators';

import type { Produto, Variacao, VariacaoTipoUi } from '../../../../shared/models/produto.model';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { StorefrontCartService } from '../../services/storefront-cart.service';
import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { resolveVariacaoTipo, sortVariacoesParaFicha } from '../../utils/variacao-ui.util';

type ProductState = { status: 'loading' } | { status: 'found'; product: Produto } | { status: 'not-found' };

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, IconComponent],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.scss',
})
export class ProductPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(StorefrontCatalogService);
  private readonly cart = inject(StorefrontCartService);
  private readonly context = inject(StorefrontContextService);

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

  protected readonly mainPhotoIndex = signal(0);
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
    effect(() => {
      const p = this.product();
      untracked(() => {
        this.mainPhotoIndex.set(0);
        this.quantity.set(1);
        this.observacao.set('');
        if (!p) { this.selectedOpcaoPorVariacao.set({}); return; }
        const sel: Record<string, string> = {};
        for (const v of this.sortVariacoes(p)) {
          const firstInStock = v.opcoes.find((o) => o.estoque > 0);
          const pick = firstInStock ?? v.opcoes[0];
          if (pick) sel[v.id] = pick.id;
        }
        this.selectedOpcaoPorVariacao.set(sel);
      });
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
    void this.router.navigate(['/cart']);
  }
}
