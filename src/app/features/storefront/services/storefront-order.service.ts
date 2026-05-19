import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

interface StorefrontOrderLinePayload {
  id: null;
  productId: string;
  titulo: string;
  quantidade: number;
  precoUnit: number;
}

interface StorefrontCreateOrderPayload {
  id: null;
  tenantId: null;
  status: null;
  subtotal: number;
  cliente: {
    nome: string;
    cpfCnpj: string;
    telefone: string;
    observacoes: string;
  };
  pagamento: {
    forma: string;
    bandeira: string | null;
    parcelas: number | null;
    modoCartao: string | null;
    trocoPara: number | null;
  };
  entrega: {
    modo: string;
    cep: string | null;
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    uf: string | null;
    cidade: string | null;
    complemento: string | null;
  };
  linhas: StorefrontOrderLinePayload[];
  criadoEm: null;
}

interface StorefrontOrderResponse {
  id: string;
}

@Injectable({ providedIn: 'root' })
export class StorefrontOrderService {
  private readonly http = inject(HttpClient);

  create(payload: StorefrontCreateOrderPayload): Observable<StorefrontOrderResponse> {
    return this.http.post<StorefrontOrderResponse>(
      `${environment.apiUrl}/api/v1/storefront/orders`,
      payload,
    );
  }
}

export type { StorefrontCreateOrderPayload };
