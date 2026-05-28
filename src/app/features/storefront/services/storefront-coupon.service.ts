import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import type { ValidarCupomResponse } from '../models/coupon.model';

@Injectable({ providedIn: 'root' })
export class StorefrontCouponService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/api/v1/storefront/cupons`;

  readonly applied = signal<ValidarCupomResponse | null>(null);
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  readonly desconto = computed(() => this.applied()?.desconto ?? 0);

  /** Chama o endpoint de validação. Não incrementa uso. */
  validar(codigo: string, subtotal: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.post<ValidarCupomResponse>(
      `${this.BASE}/validar`,
      { codigo: codigo.toUpperCase().trim(), valorPedido: subtotal }
    ).subscribe({
      next: (res) => {
        this.applied.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.detail ?? err?.error?.message ?? 'Cupom inválido.';
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }

  remover(): void {
    this.applied.set(null);
    this.error.set(null);
  }
}
