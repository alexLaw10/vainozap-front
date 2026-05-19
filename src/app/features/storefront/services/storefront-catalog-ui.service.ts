import { Injectable, signal } from '@angular/core';
import type { Router } from '@angular/router';

/**
 * Estado de UI partilhado entre o header (menu hambúrguer) e o catálogo (filtro por categoria).
 * As categorias em si vêm do `StorefrontCatalogService` (dados da API/mock).
 */
@Injectable()
export class StorefrontCatalogUiService {
  readonly categoryMenuOpen = signal(false);
  readonly selectedCategoryId = signal<string | null>(null);

  openCategoryMenu(): void {
    this.categoryMenuOpen.set(true);
  }

  closeCategoryMenu(): void {
    this.categoryMenuOpen.set(false);
  }

  /** Filtro na grelha do catálogo (pílulas na home). */
  selectCategory(id: string | null): void {
    this.selectedCategoryId.set(id);
  }

  /** Escolha a partir do drawer: aplica filtro, fecha o menu e leva ao bloco de produtos. */
  chooseCategoryFromMenu(id: string | null, router: Router): void {
    this.selectedCategoryId.set(id);
    this.categoryMenuOpen.set(false);
    void router.navigate(['/'], { fragment: 'produtos' });
  }
}
