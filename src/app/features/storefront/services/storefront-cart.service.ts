import { computed, effect, inject, Injectable, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

export interface CartLine {
  id: string;
  productId: string;
  titulo: string;
  quantidade: number;
  precoUnit: number;
  thumbUrl?: string;
}

interface CartSnapshot {
  lines: CartLine[];
  savedAt: number;
}

const STORAGE_KEY  = 'sf:cart';
const TTL_MS       = 7 * 24 * 60 * 60 * 1000; // 7 dias

function newLineId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `l-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

@Injectable({ providedIn: 'root' })
export class StorefrontCartService {
  private readonly router      = inject(Router);
  private readonly platformId  = inject(PLATFORM_ID);
  private readonly isBrowser   = isPlatformBrowser(this.platformId);

  readonly lines = signal<CartLine[]>(this.loadFromStorage());

  readonly subtotal = computed(() =>
    this.lines().reduce((sum, l) => sum + l.precoUnit * l.quantidade, 0),
  );

  constructor() {
    // Persiste no localStorage sempre que o carrinho mudar
    effect(() => {
      const lines = this.lines();
      this.saveToStorage(lines);
    });
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  addLine(line: Omit<CartLine, 'id'>): void {
    const id = newLineId();
    this.lines.update((xs) => [...xs, { ...line, id }]);
  }

  removeLine(id: string): void {
    this.lines.update((xs) => xs.filter((l) => l.id !== id));
  }

  updateQty(id: string, quantidade: number): void {
    if (quantidade < 1) {
      this.removeLine(id);
      return;
    }
    this.lines.update((xs) =>
      xs.map((l) => (l.id === id ? { ...l, quantidade: Math.min(999, quantidade) } : l)),
    );
  }

  clear(): void {
    this.lines.set([]);
    // O effect acima detecta lines=[] e remove a entrada do localStorage
  }

  /** Soma unidades no carrinho para o mesmo `productId` (várias variantes). */
  totalQtyForProduct(productId: string): number {
    return this.lines()
      .filter((l) => l.productId === productId)
      .reduce((sum, l) => sum + l.quantidade, 0);
  }

  /** Remove uma unidade (última linha com stock primeiro). */
  decrementProduct(productId: string): void {
    const matches = this.lines().filter((l) => l.productId === productId);
    for (let i = matches.length - 1; i >= 0; i--) {
      const l = matches[i];
      if (l.quantidade > 1) {
        this.updateQty(l.id, l.quantidade - 1);
        return;
      }
      this.removeLine(l.id);
      return;
    }
  }

  /**
   * +1 no catálogo: uma só linha incrementa; várias linhas (variantes) abre a ficha.
   */
  incrementProductFromCatalog(productId: string): void {
    const matches = this.lines().filter((l) => l.productId === productId);
    if (matches.length === 1) {
      this.updateQty(matches[0].id, matches[0].quantidade + 1);
      return;
    }
    if (matches.length > 1) {
      void this.router.navigate(['/products', productId]);
    }
  }

  // ── localStorage ──────────────────────────────────────────────────────────

  private loadFromStorage(): CartLine[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const snap = JSON.parse(raw) as CartSnapshot;
      if (!Array.isArray(snap.lines) || Date.now() - snap.savedAt > TTL_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      return snap.lines;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  private saveToStorage(lines: CartLine[]): void {
    if (!this.isBrowser) return;
    try {
      if (lines.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const snap: CartSnapshot = { lines, savedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch {
      // quota exceeded — ignora silenciosamente
    }
  }
}
