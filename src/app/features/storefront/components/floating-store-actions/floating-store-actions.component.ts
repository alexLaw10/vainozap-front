import { Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { StorefrontContextService } from '../../services/storefront-context.service';

@Component({
  selector: 'app-floating-store-actions',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './floating-store-actions.component.html',
  styleUrl: './floating-store-actions.component.scss',
})
export class FloatingStoreActionsComponent implements OnInit, OnDestroy {
  protected readonly context = inject(StorefrontContextService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly showScrollTop = signal(false);

  private onScroll = (): void => {
    this.showScrollTop.set(window.scrollY > 300);
  };

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', this.onScroll, { passive: true });
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  protected waLink(): string {
    const n = this.context.tenant().whatsapp.replace(/\D/g, '');
    return `https://wa.me/${n}`;
  }

  protected scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
