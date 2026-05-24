import { Component, HostListener, computed, inject, signal } from '@angular/core';

import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { VitrineBannerComponent } from '../../components/vitrine-banner/vitrine-banner.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { StorefrontCatalogUiService } from '../../services/storefront-catalog-ui.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { StorefrontFiltersService } from '../../services/storefront-filters.service';

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
  protected readonly context  = inject(StorefrontContextService);
  protected readonly catalog  = inject(StorefrontCatalogService);
  protected readonly catalogUi = inject(StorefrontCatalogUiService);
  protected readonly filters  = inject(StorefrontFiltersService);

  protected readonly sortMode     = signal<CatalogSortMode>('category');
  protected readonly sortPanelOpen = signal(false);

  protected readonly SORT_OPTIONS: SortOption[] = [
    { value: 'category',   label: 'Categoria',    icon: '↕' },
    { value: 'name-asc',   label: 'A - Z',        icon: '↓A' },
    { value: 'name-desc',  label: 'Z - A',        icon: '↓Z' },
    { value: 'price-desc', label: 'Maior preço',  icon: '↓$' },
    { value: 'price-asc',  label: 'Menor preço',  icon: '↑$' },
    { value: 'newest',     label: 'Novidades',    icon: '✦' },
  ];

  protected readonly emptyProductsMsg = computed(() => {
    if (this.catalog.loading()) return null;
    if (this.filteredProducts().length > 0) return null;
    const hasProducts = this.catalog.listProducts().length > 0;
    return hasProducts
      ? 'Nenhum produto encontrado para os filtros selecionados.'
      : 'Nenhum produto cadastrado ainda.';
  });

  protected readonly filteredProducts = computed(() => {
    let list = this.catalog.listProducts().filter((p) => p.ativo);
    const cat = this.catalogUi.selectedCategoryId();
    if (cat) list = list.filter((p) => p.categoriaId === cat);
    list = list.filter((p) => this.filters.productPassesAppliedFilters(p));

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
    // 'category' mantém a ordem original da API
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
}
