import { isPlatformBrowser } from '@angular/common';
import { Component, HostListener, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { VitrineBannerComponent } from '../../components/vitrine-banner/vitrine-banner.component';
import { IconComponent, ToastService } from '@app/shared/ui';
import { StorefrontCartService } from '../../services/storefront-cart.service';
import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { StorefrontCatalogUiService } from '../../services/storefront-catalog-ui.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { StorefrontFiltersService } from '../../services/storefront-filters.service';
import { StorefrontRecentSearchesService } from '../../services/storefront-recent-searches.service';
import { StorefrontRecentlyViewedService } from '../../services/storefront-recently-viewed.service';
import { buildDefaultCatalogCartLine } from '../../utils/default-catalog-cart-line.util';

export type CatalogSortMode = 'category' | 'name-asc' | 'name-desc' | 'price-desc' | 'price-asc' | 'newest';

export interface SortOption {
  value: CatalogSortMode;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [ProductCardComponent, VitrineBannerComponent, IconComponent],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
})
export class CatalogPageComponent {
  protected readonly context        = inject(StorefrontContextService);
  protected readonly catalog        = inject(StorefrontCatalogService);
  protected readonly catalogUi      = inject(StorefrontCatalogUiService);
  protected readonly filters        = inject(StorefrontFiltersService);
  protected readonly recentlyViewed = inject(StorefrontRecentlyViewedService);
  protected readonly recentSearches = inject(StorefrontRecentSearchesService);
  private   readonly cart           = inject(StorefrontCartService);
  private   readonly toast          = inject(ToastService);
  private   readonly route          = inject(ActivatedRoute);
  private   readonly isBrowser      = isPlatformBrowser(inject(PLATFORM_ID));
  private   readonly metaService    = inject(Meta);
  private   readonly titleService   = inject(Title);

  protected readonly sortMode        = signal<CatalogSortMode>('category');
  protected readonly sortPanelOpen   = signal(false);
  protected readonly skeletonItems   = Array(8).fill(0);
  /** Controla visibilidade do dropdown de buscas recentes. */
  protected readonly searchFocused   = signal(false);
  /** Grade (padrão) ou lista. Persiste em localStorage. */
  protected readonly viewMode        = signal<'grid' | 'list'>(this.loadViewMode());

  protected readonly SORT_OPTIONS: SortOption[] = [
    { value: 'category',   label: 'Categoria',    icon: '↕' },
    { value: 'name-asc',   label: 'A - Z',        icon: '↓A' },
    { value: 'name-desc',  label: 'Z - A',        icon: '↓Z' },
    { value: 'price-desc', label: 'Maior preço',  icon: '↓$' },
    { value: 'price-asc',  label: 'Menor preço',  icon: '↑$' },
    { value: 'newest',     label: 'Novidades',    icon: '✦' },
  ];

  /** Produtos marcados como destaque, ativos e não esgotados. */
  protected readonly destaqueProducts = computed(() =>
    this.catalog.listProducts().filter((p) => p.ativo && p.destaque),
  );

  /** Produtos vistos recentemente (na ordem de visita, excluindo inativos). */
  protected readonly recentProducts = computed(() => {
    const ids      = this.recentlyViewed.ids();
    const products = this.catalog.listProducts();
    return ids
      .map((id) => products.find((p) => p.id === id && p.ativo))
      .filter((p): p is NonNullable<typeof p> => p != null);
  });

  /** Contador de produtos ativos por categoria ID. */
  protected readonly productCountByCategory = computed(() => {
    const map = new Map<string, number>();
    for (const p of this.catalog.listProducts()) {
      if (!p.ativo) continue;
      map.set(p.categoriaId, (map.get(p.categoriaId) ?? 0) + 1);
    }
    return map;
  });

  protected readonly emptyProductsMsg = computed(() => {
    if (this.catalog.loading()) return null;
    if (this.filteredProducts().length > 0) return null;
    const hasProducts = this.catalog.listProducts().length > 0;
    if (!hasProducts) return 'Nenhum produto cadastrado ainda.';
    const hasCategory = !!this.catalogUi.selectedCategoryId();
    const hasFilters   = this.filters.hasActiveFilters();
    if (hasCategory && hasFilters) return 'Nenhum produto encontrado nessa categoria com esses filtros.';
    if (hasCategory) return 'Nenhum produto encontrado nessa categoria.';
    if (hasFilters)  return 'Nenhum produto encontrado com os filtros selecionados.';
    return 'Nenhum produto encontrado.';
  });

  protected readonly canClearFilters = computed(() =>
    !!this.catalogUi.selectedCategoryId() || this.filters.hasActiveFilters() || !!this.catalogUi.searchQuery().trim()
  );

  protected readonly activeChips = computed(() => this.filters.activeChips());

  protected readonly totalActiveProducts = computed(() =>
    this.catalog.listProducts().filter(p => p.ativo).length
  );

  /** Buscas recentes filtradas pela query atual (sugestões). */
  protected readonly searchSuggestions = computed(() => {
    const q = this.catalogUi.searchQuery().trim().toLowerCase();
    const all = this.recentSearches.searches();
    if (!q) return all;
    return all.filter(s => s.toLowerCase().startsWith(q));
  });

  /** Mostra o dropdown se estiver focado e houver sugestões. */
  protected readonly showSearchDropdown = computed(() =>
    this.searchFocused() && this.searchSuggestions().length > 0,
  );

  constructor() {
    // ── SEO meta tags dinâmicas da vitrine ────────────────────────────────
    effect(() => {
      const t = this.context.tenant();
      if (!t?.nomeLoja) return;
      untracked(() => {
        const title = t.slogan ? `${t.nomeLoja} — ${t.slogan}` : t.nomeLoja;
        const desc  = t.slogan ?? `Confira os produtos de ${t.nomeLoja} e faça seu pedido pelo WhatsApp.`;
        const image = t.bannerUrl ?? t.logoUrl ?? '';
        const url   = typeof location !== 'undefined' ? location.href : '';

        this.titleService.setTitle(title);
        this.metaService.updateTag({ name: 'description',          content: desc });
        this.metaService.updateTag({ property: 'og:type',          content: 'website' });
        this.metaService.updateTag({ property: 'og:title',         content: t.nomeLoja });
        this.metaService.updateTag({ property: 'og:description',   content: desc });
        this.metaService.updateTag({ property: 'og:site_name',     content: t.nomeLoja });
        if (image) this.metaService.updateTag({ property: 'og:image', content: image });
        if (url)   this.metaService.updateTag({ property: 'og:url',   content: url });
        // Twitter/X card
        this.metaService.updateTag({ name: 'twitter:card',         content: 'summary_large_image' });
        this.metaService.updateTag({ name: 'twitter:title',        content: t.nomeLoja });
        this.metaService.updateTag({ name: 'twitter:description',  content: desc });
        if (image) this.metaService.updateTag({ name: 'twitter:image', content: image });
      });
    });

    // ── Link pré-montado: /?produto=uuid ──────────────────────────────────
    // Quando o catálogo terminar de carregar, adiciona o produto ao carrinho.
    effect(() => {
      if (this.catalog.loading()) return;
      const params = this.route.snapshot.queryParamMap;
      const produtoId = params.get('produto');
      if (!produtoId) return;

      untracked(() => {
        const produto = this.catalog.listProducts().find(p => p.id === produtoId && p.ativo);
        if (!produto) return;
        const line = buildDefaultCatalogCartLine(produto);
        if (!line) return;
        this.cart.addLine(line);
        this.toast.show({
          message:     `${produto.nome} adicionado ao carrinho 🛒`,
          actionLabel: 'Ver pedido →',
          actionRoute: '/cart',
        });
      });
    });
  }

  protected clearAllFilters(): void {
    this.catalogUi.selectedCategoryId.set(null);
    this.catalogUi.searchQuery.set('');
    this.filters.clearAll();
  }

  protected removeChip(chip: { kind: string; groupId: string; optionId?: string }): void {
    if (chip.kind === 'choice' && chip.optionId) this.filters.removeChoice(chip.groupId, chip.optionId);
    else if (chip.kind === 'priceMin') this.filters.removePriceMin();
    else if (chip.kind === 'priceMax') this.filters.removePriceMax();
  }

  protected readonly filteredProducts = computed(() => {
    let list = this.catalog.listProducts().filter((p) => p.ativo);
    const cat = this.catalogUi.selectedCategoryId();
    if (cat) list = list.filter((p) => p.categoriaId === cat);
    list = list.filter((p) => this.filters.productPassesAppliedFilters(p));
    const q = this.catalogUi.searchQuery().trim().toLowerCase();
    if (q) list = list.filter((p) =>
      p.nome.toLowerCase().includes(q) || p.descricao?.toLowerCase().includes(q)
    );

    const sort = this.sortMode();
    const copy = [...list];
    if (sort === 'name-asc') {
      copy.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    } else if (sort === 'name-desc') {
      copy.sort((a, b) => b.nome.localeCompare(a.nome, 'pt-BR'));
    } else if (sort === 'price-asc') {
      copy.sort((a, b) => a.preco - b.preco);
    } else if (sort === 'price-desc') {
      copy.sort((a, b) => b.preco - a.preco);
    } else if (sort === 'newest') {
      copy.sort((a, b) => b.id.localeCompare(a.id));
    }
    return copy;
  });

  protected openSortPanel(): void  { this.sortPanelOpen.set(true); }
  protected closeSortPanel(): void { this.sortPanelOpen.set(false); }

  protected selectSort(mode: CatalogSortMode): void {
    this.sortMode.set(mode);
    this.closeSortPanel();
  }

  protected currentSortLabel(): string {
    return this.SORT_OPTIONS.find(o => o.value === this.sortMode())?.label ?? 'Ordenar';
  }

  // ── View mode ────────────────────────────────────────────────────────────
  protected toggleViewMode(): void {
    this.viewMode.update((m) => {
      const next = m === 'grid' ? 'list' : 'grid';
      if (this.isBrowser) {
        try { localStorage.setItem('sf:view-mode', next); } catch { /* quota */ }
      }
      return next;
    });
  }

  // ── Buscas recentes ──────────────────────────────────────────────────────
  protected onSearchFocus(): void    { this.searchFocused.set(true); }
  protected onSearchBlur(): void {
    // Pequeno delay para o click na sugestão disparar antes do blur fechar o dropdown
    setTimeout(() => this.searchFocused.set(false), 150);
  }

  protected onSearchInput(value: string): void {
    this.catalogUi.searchQuery.set(value);
  }

  protected onSearchKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'Enter') {
      const q = this.catalogUi.searchQuery().trim();
      if (q) this.recentSearches.add(q);
      this.searchFocused.set(false);
    }
  }

  protected applySuggestion(s: string): void {
    this.catalogUi.searchQuery.set(s);
    this.recentSearches.add(s);
    this.searchFocused.set(false);
  }

  protected removeSuggestion(ev: Event, s: string): void {
    ev.stopPropagation();
    this.recentSearches.remove(s);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.sortPanelOpen()) this.closeSortPanel();
  }

  protected selectCategory(id: string | null): void {
    this.catalogUi.selectCategory(id);
  }

  protected isCategorySelected(id: string): boolean {
    return this.catalogUi.selectedCategoryId() === id;
  }

  protected isAllCategoriesSelected(): boolean {
    return this.catalogUi.selectedCategoryId() === null;
  }

  // ── localStorage ─────────────────────────────────────────────────────────
  private loadViewMode(): 'grid' | 'list' {
    if (!this.isBrowser) return 'grid';
    try {
      const v = localStorage.getItem('sf:view-mode');
      return v === 'list' ? 'list' : 'grid';
    } catch { return 'grid'; }
  }
}
