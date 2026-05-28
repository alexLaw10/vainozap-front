import { DOCUMENT } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';

import { ToastComponent } from '@app/shared/ui';
import { FloatingStoreActionsComponent } from '../floating-store-actions/floating-store-actions.component';
import { StorefrontFiltersModalComponent } from '../storefront-filters-modal/storefront-filters-modal.component';
import { VitrineFooterComponent } from '../vitrine-footer/vitrine-footer.component';
import { VitrineHeaderComponent } from '../vitrine-header/vitrine-header.component';
import { StorefrontCatalogService } from '../../services/storefront-catalog.service';
import { StorefrontCatalogUiService } from '../../services/storefront-catalog-ui.service';
import { StorefrontContextService } from '../../services/storefront-context.service';
import { StorefrontFiltersService } from '../../services/storefront-filters.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    VitrineHeaderComponent,
    VitrineFooterComponent,
    FloatingStoreActionsComponent,
    StorefrontFiltersModalComponent,
    ToastComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  providers: [
    StorefrontCatalogService,
    StorefrontCatalogUiService,
    StorefrontFiltersService,
  ],
})
export class ShellComponent {
  private readonly doc = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly context = inject(StorefrontContextService);
  private readonly catalog = inject(StorefrontCatalogService);

  protected readonly tenant = this.context.tenant;
  protected readonly barDismissed = signal(false);

  protected dismissBar(): void { this.barDismissed.set(true); }

  constructor() {
    this.catalog.load();

    effect(() => {
      const tenant = this.context.tenant();

      // Tab title
      const tab = (tenant.tituloDocumento?.trim() || tenant.nomeLoja).trim();
      this.title.setTitle(tab.length > 0 ? tab : 'Loja');

      // Favicon
      const href = tenant.faviconUrl;
      let link = this.doc.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = this.doc.createElement('link');
        link.rel = 'icon';
        this.doc.head.appendChild(link);
      }
      if (href) {
        link.href = href;
        const h = href.toLowerCase();
        link.type = h.endsWith('.ico')
          ? 'image/x-icon'
          : h.endsWith('.svg')
            ? 'image/svg+xml'
            : 'image/png';
      } else {
        link.href = 'favicon.ico';
        link.type = 'image/x-icon';
      }

      // Brand colors são aplicadas pelo StorefrontContextService via effect().
    });
  }
}
