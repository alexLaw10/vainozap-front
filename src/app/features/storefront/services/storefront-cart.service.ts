import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface CartLine {
  id: string;
  productId: string;
  titulo: string;
  quantidade: number;
  precoUnit: number;
  thumbUrl?: string;
}

function newLineId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `l-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

@Injectable({ providedIn: 'root' })
export class StorefrontCartService {
  private readonly router = inject(Router);

  readonly lines = signal<CartLine[]>([]);

  readonly subtotal = computed(() =>
    this.lines().reduce((sum, l) => sum + l.precoUnit * l.quantidade, 0),
  );

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
   * +1 no catálogo: uma só linha desse produto incrementa; várias linhas (variantes) abre a ficha.
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
}
