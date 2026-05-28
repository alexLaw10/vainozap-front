import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { VendasResumoApi } from '../models/vendas-api.model';

@Injectable()
export class MerchantVendasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/merchant/vendas`;

  resumo(periodo: string): Observable<VendasResumoApi> {
    return this.http.get<VendasResumoApi>(`${this.base}/resumo`, {
      params: { periodo },
    });
  }
}
