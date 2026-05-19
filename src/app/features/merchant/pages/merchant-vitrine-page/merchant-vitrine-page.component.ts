import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CatalogPageComponent } from '../../../storefront/pages/catalog-page/catalog-page.component';
import { StorefrontCatalogService } from '../../../storefront/services/storefront-catalog.service';
import { StorefrontCatalogUiService } from '../../../storefront/services/storefront-catalog-ui.service';
import { StorefrontContextService } from '../../../storefront/services/storefront-context.service';
import { StorefrontFiltersService } from '../../../storefront/services/storefront-filters.service';
import { VitrineFooterComponent } from '../../../storefront/components/vitrine-footer/vitrine-footer.component';
import { VitrineHeaderComponent } from '../../../storefront/components/vitrine-header/vitrine-header.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { MerchantContextService } from '../../services/merchant-context.service';

@Component({
  selector: 'app-merchant-vitrine-page',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    VitrineHeaderComponent,
    CatalogPageComponent,
    VitrineFooterComponent,
  ],
  providers: [
    StorefrontCatalogService,
    StorefrontCatalogUiService,
    StorefrontFiltersService,
  ],
  templateUrl: './merchant-vitrine-page.component.html',
  styleUrl: './merchant-vitrine-page.component.scss',
})
export class MerchantVitrinePageComponent {
  private readonly ctx       = inject(MerchantContextService);
  private readonly sfCatalog = inject(StorefrontCatalogService);

  protected readonly loading = signal(true);

  constructor() {
    // Aguarda o MerchantContextService terminar de carregar o tenant do shell.
    // Só carrega o catálogo depois que StorefrontContextService.tenant() já tem
    // o slug correto do merchant — evita buscar produtos do tenant errado.
    effect(() => {
      if (!this.ctx.loading()) {
        this.sfCatalog.load();
        this.loading.set(false);
      }
    });
  }
}
