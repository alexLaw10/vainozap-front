import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'sf:cookie-consent';

export type CookieConsentChoice = 'accepted' | 'declined';

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** null = ainda não respondeu | 'accepted' | 'declined' */
  readonly choice = signal<CookieConsentChoice | null>(this.load());

  /** true enquanto o banner deve ser exibido */
  readonly showBanner = signal(this.choice() === null);

  accept(): void {
    this.save('accepted');
    this.choice.set('accepted');
    this.showBanner.set(false);
  }

  decline(): void {
    this.save('declined');
    this.choice.set('declined');
    this.showBanner.set(false);
  }

  private load(): CookieConsentChoice | null {
    if (!this.isBrowser) return null;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'accepted' || v === 'declined' ? v : null;
    } catch { return null; }
  }

  private save(v: CookieConsentChoice): void {
    if (!this.isBrowser) return;
    try { localStorage.setItem(STORAGE_KEY, v); } catch { /* quota */ }
  }
}
