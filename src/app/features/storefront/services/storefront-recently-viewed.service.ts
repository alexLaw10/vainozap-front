import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'sf:recently-viewed';
const MAX_ITEMS   = 8;

/**
 * Rastreia os IDs dos produtos visitados recentemente.
 * Persiste em localStorage com TTL de 7 dias.
 */
@Injectable({ providedIn: 'root' })
export class StorefrontRecentlyViewedService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** IDs dos produtos visitados recentemente, do mais recente ao mais antigo. */
  readonly ids = signal<string[]>(this.loadFromStorage());

  /**
   * Registra uma visita a um produto.
   * Move para o topo se já existia, remove o mais antigo quando excede MAX_ITEMS.
   */
  track(productId: string): void {
    this.ids.update((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      const next     = [productId, ...filtered].slice(0, MAX_ITEMS);
      this.saveToStorage(next);
      return next;
    });
  }

  // ── localStorage ────────────────────────────────────────────────────────

  private loadFromStorage(): string[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { ids: string[]; savedAt: number };
      const ttl = 7 * 24 * 60 * 60 * 1000;
      if (!Array.isArray(parsed.ids) || Date.now() - parsed.savedAt > ttl) {
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      return parsed.ids;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  private saveToStorage(ids: string[]): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids, savedAt: Date.now() }));
    } catch { /* quota exceeded */ }
  }
}
