import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'sf:recent-searches';
const MAX_ITEMS   = 6;

/**
 * Mantém um histórico das últimas buscas do cliente (localStorage).
 * Exibido como sugestões ao focar na barra de busca.
 */
@Injectable({ providedIn: 'root' })
export class StorefrontRecentSearchesService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Últimas buscas, da mais recente para a mais antiga. */
  readonly searches = signal<string[]>(this.loadFromStorage());

  /** Persiste uma nova busca no topo. Ignora strings em branco / duplicadas. */
  add(query: string): void {
    const q = query.trim();
    if (!q || q.length < 2) return;
    this.searches.update((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== q.toLowerCase());
      const next     = [q, ...filtered].slice(0, MAX_ITEMS);
      this.saveToStorage(next);
      return next;
    });
  }

  remove(query: string): void {
    this.searches.update((prev) => {
      const next = prev.filter((s) => s !== query);
      this.saveToStorage(next);
      return next;
    });
  }

  clear(): void {
    this.searches.set([]);
    if (this.isBrowser) {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }

  // ── localStorage ──────────────────────────────────────────────────────────

  private loadFromStorage(): string[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { searches: string[] };
      return Array.isArray(parsed.searches) ? parsed.searches : [];
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  private saveToStorage(searches: string[]): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ searches }));
    } catch { /* quota exceeded */ }
  }
}
