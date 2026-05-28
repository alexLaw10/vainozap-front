import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'sf:wishlist';
const MAX_ITEMS   = 50;

/**
 * Lista de desejos do cliente — persiste em localStorage sem expiração.
 * Funciona 100% no front sem autenticação.
 */
@Injectable({ providedIn: 'root' })
export class StorefrontWishlistService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** IDs dos produtos na lista de desejos. */
  readonly ids = signal<string[]>(this.loadFromStorage());

  /** Adiciona se não está / remove se já está. */
  toggle(productId: string): void {
    this.ids.update((prev) => {
      const exists = prev.includes(productId);
      const next   = exists
        ? prev.filter((id) => id !== productId)
        : [productId, ...prev].slice(0, MAX_ITEMS);
      this.saveToStorage(next);
      return next;
    });
  }

  isWishlisted(productId: string): boolean {
    return this.ids().includes(productId);
  }

  // ── localStorage ──────────────────────────────────────────────────────────

  private loadFromStorage(): string[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { ids: string[] };
      return Array.isArray(parsed.ids) ? parsed.ids : [];
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  private saveToStorage(ids: string[]): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids }));
    } catch { /* quota exceeded */ }
  }
}
