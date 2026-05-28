import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { environment } from '../../../../../../environments/environment';
import { StorefrontCatalogService } from '../../../../storefront/services/storefront-catalog.service';
import { StorefrontCatalogUiService } from '../../../../storefront/services/storefront-catalog-ui.service';
import { StorefrontContextService } from '../../../../storefront/services/storefront-context.service';
import { StorefrontFiltersService } from '../../../../storefront/services/storefront-filters.service';
import { VitrineFooterComponent } from '../../../../storefront/components/vitrine-footer/vitrine-footer.component';
import { VitrineHeaderComponent } from '../../../../storefront/components/vitrine-header/vitrine-header.component';
import { CatalogPageComponent } from '../../../../storefront/pages/catalog-page/catalog-page.component';
import { IconComponent } from '@app/shared/ui';
import type { TenantApi } from '../../../../../core/models/tenant-api.model';

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
  private readonly http      = inject(HttpClient);
  private readonly sfContext = inject(StorefrontContextService);
  private readonly sfCatalog = inject(StorefrontCatalogService);

  protected readonly loading = signal(true);

  constructor() {
    // Carrega os dados reais da loja via merchant/settings (JWT — sem slug na URL).
    // Evita chamar a rota pública /stores/slug/... que não é necessária aqui.
    this.http
      .get<TenantApi>(`${environment.apiUrl}/api/v1/merchant/settings`)
      .subscribe({
        next: (t) => {
          this.sfContext.setTenantFromApi(t);
          this.sfCatalog.load();
          this.loading.set(false);
        },
        error: () => {
          // Mesmo sem dados completos, mostra a prévia com o que tiver
          this.sfCatalog.load();
          this.loading.set(false);
        },
      });
  }
}
