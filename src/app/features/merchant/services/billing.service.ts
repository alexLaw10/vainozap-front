import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface CheckoutRequest {
  planoTipo: 'basico' | 'profissional' | 'business';
  ciclo: 'MONTHLY' | 'YEARLY';
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface PagamentoHistorico {
  id: string;
  valor: number;
  status: string;
  metodoPagamento: string | null;
  vencimento: string | null;
  pagoEm: string | null;
  descricao: string | null;
  criadoEm: string;
}

/**
 * Serviço de billing — comunica com o módulo de assinatura do backend.
 *
 * Endpoints:
 *   POST /api/v1/merchant/billing/checkout   → gera URL de pagamento Asaas
 *   GET  /api/v1/merchant/billing/historico  → histórico de cobranças
 *   DELETE /api/v1/merchant/billing/assinatura → cancela assinatura
 */
@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/merchant/billing`;

  /**
   * Inicia o checkout de um plano.
   * Retorna a URL da fatura Asaas (boleto/PIX) para abrir em nova aba.
   */
  checkout(req: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.base}/checkout`, req);
  }

  /**
   * Lista o histórico de cobranças do tenant autenticado.
   */
  historico(): Observable<PagamentoHistorico[]> {
    return this.http.get<PagamentoHistorico[]>(`${this.base}/historico`);
  }

  /**
   * Cancela a assinatura ativa.
   */
  cancelar(): Observable<void> {
    return this.http.delete<void>(`${this.base}/assinatura`);
  }
}
