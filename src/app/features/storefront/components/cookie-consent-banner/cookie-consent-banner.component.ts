import { Component, inject } from '@angular/core';
import { CookieConsentService } from '../../services/cookie-consent.service';

@Component({
  selector: 'app-cookie-consent-banner',
  standalone: true,
  templateUrl: './cookie-consent-banner.component.html',
  styleUrl: './cookie-consent-banner.component.scss',
})
export class CookieConsentBannerComponent {
  protected readonly consent = inject(CookieConsentService);
}
