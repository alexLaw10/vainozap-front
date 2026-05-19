import { Component, inject } from '@angular/core';

import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { StorefrontContextService } from '../../services/storefront-context.service';

@Component({
  selector: 'app-floating-store-actions',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './floating-store-actions.component.html',
  styleUrl: './floating-store-actions.component.scss',
})
export class FloatingStoreActionsComponent {
  protected readonly context = inject(StorefrontContextService);

  protected waLink(): string {
    const n = this.context.tenant().whatsapp.replace(/\D/g, '');
    return `https://wa.me/${n}`;
  }

  protected scrollToMain(): void {
    document.getElementById('storefront-main')?.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('storefront-main')?.focus({ preventScroll: true });
  }
}
