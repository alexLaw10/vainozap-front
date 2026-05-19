import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { fromEvent } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { StorefrontCartService } from '../../services/storefront-cart.service';
import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { StorefrontCatalogUiService } from '../../services/storefront-catalog-ui.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { StorefrontFiltersService } from '../../services/storefront-filters.service';

@Component({
  selector: 'app-vitrine-header',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './vitrine-header.component.html',
  styleUrl: './vitrine-header.component.scss',
  host: {
    '[class.vitrine-header-host--elevated]': 'elevated()',
  },
})
export class VitrineHeaderComponent {
  protected readonly context = inject(StorefrontContextService);
  protected readonly filters = inject(StorefrontFiltersService);
  protected readonly catalog = inject(StorefrontCatalogService);
  protected readonly catalogUi = inject(StorefrontCatalogUiService);
  private readonly cart = inject(StorefrontCartService);
  private readonly router = inject(Router);

  /** Lista dinâmica (API/mock via catálogo). */
  protected readonly categories = computed(() => this.catalog.listCategories());

  /** Quantidade de unidades no carrinho (badge na vitrine). */
  protected readonly cartCount = computed(() =>
    this.cart.lines().reduce((n, l) => n + l.quantidade, 0),
  );
  /** Header colado no topo com fundo mais claro após rolar um pouco. */
  protected readonly elevated = signal(false);

  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const win = this.doc.defaultView;
      if (!win) return;

      const thresholdPx = 8;
      const sync = (): void => {
        this.elevated.set(win.scrollY > thresholdPx);
      };
      sync();

      fromEvent(win, 'scroll', { passive: true })
        .pipe(
          map(() => win.scrollY > thresholdPx),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((v) => this.elevated.set(v));
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscapeMenu(): void {
    if (this.catalogUi.categoryMenuOpen()) {
      this.catalogUi.closeCategoryMenu();
    }
  }

  protected openCategoryMenu(): void {
    this.catalogUi.openCategoryMenu();
  }

  protected closeCategoryMenu(): void {
    this.catalogUi.closeCategoryMenu();
  }

  protected chooseCategory(id: string | null): void {
    this.catalogUi.chooseCategoryFromMenu(id, this.router);
  }

  protected isCategoryRowActive(id: string): boolean {
    return this.catalogUi.selectedCategoryId() === id;
  }

  protected isAllCategoriesRowActive(): boolean {
    return this.catalogUi.selectedCategoryId() === null;
  }
}
