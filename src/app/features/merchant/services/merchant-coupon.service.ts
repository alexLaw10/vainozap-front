import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface CupomDto {
  id?: string;
  codigo: string;
  tipo: 'PERCENTUAL' | 'VALOR_FIXO';
  valor: number;
  valorMinimoPedido?: number | null;
  limiteUsos?: number | null;
  totalUsado?: number;
  dataExpiracao?: string | null;  // ISO datetime string
  ativo: boolean;
  criadoEm?: string;
}

@Injectable({ providedIn: 'root' })
export class MerchantCouponService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/api/v1/merchant/cupons`;

  listar(): Observable<CupomDto[]> {
    return this.http.get<CupomDto[]>(this.BASE);
  }

  criar(c: CupomDto): Observable<CupomDto> {
    return this.http.post<CupomDto>(this.BASE, c);
  }

  atualizar(id: string, c: CupomDto): Observable<CupomDto> {
    return this.http.put<CupomDto>(`${this.BASE}/${id}`, c);
  }

  deletar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}
