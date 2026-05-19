import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { StorefrontCatalogUiService } from '../../services/storefront-catalog-ui.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { StorefrontFiltersService } from '../../services/storefront-filters.service';

export type CatalogSortMode = 'name' | 'price-asc' | 'price-desc';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [ProductCardComponent, IconComponent],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
})
export class CatalogPageComponent {
  protected readonly context = inject(StorefrontContextService);
  protected readonly catalog = inject(StorefrontCatalogService);
  protected readonly catalogUi = inject(StorefrontCatalogUiService);
  protected readonly filters = inject(StorefrontFiltersService);

  protected readonly emptyProductsMsg = computed(() => {
    if (this.catalog.loading()) return null;
    if (this.filteredProducts().length > 0) return null;
    const hasProducts = this.catalog.listProducts().length > 0;
    return hasProducts
      ? 'Nenhum produto encontrado para os filtros selecionados.'
      : 'Nenhum produto cadastrado ainda.';
  });

  protected readonly sortMode = signal<CatalogSortMode>('name');


  protected readonly filteredProducts = computed(() => {
    let list = this.catalog.listProducts().filter((p) => p.ativo);
    const cat = this.catalogUi.selectedCategoryId();
    if (cat) {
      list = list.filter((p) => p.categoriaId === cat);
    }
    list = list.filter((p) => this.filters.productPassesAppliedFilters(p));
    const sort = this.sortMode();
    const copy = [...list];
    if (sort === 'name') {
      copy.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    } else if (sort === 'price-asc') {
      copy.sort((a, b) => a.preco - b.preco);
    } else {
      copy.sort((a, b) => b.preco - a.preco);
    }
    return copy;
  });

  protected selectCategory(id: string | null): void {
    this.catalogUi.selectCategory(id);
  }

  protected isCategorySelected(id: string): boolean {
    return this.catalogUi.selectedCategoryId() === id;
  }

  protected isAllCategoriesSelected(): boolean {
    return this.catalogUi.selectedCategoryId() === null;
  }

  protected setSortFromSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as CatalogSortMode;
    this.sortMode.set(value);
  }
}
