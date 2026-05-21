import { Component, inject } from '@angular/core';
import { StorefrontContextService } from '../../services/storefront-context.service';

@Component({
  selector: 'app-vitrine-banner',
  standalone: true,
  templateUrl: './vitrine-banner.component.html',
  styleUrl: './vitrine-banner.component.scss',
})
export class VitrineBannerComponent {
  protected readonly context = inject(StorefrontContextService);
}
