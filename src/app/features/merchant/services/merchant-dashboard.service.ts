import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface DashboardResumoApi {
  pedidosHoje: number;
  pedidosPendentes: number;
  vendasMes: number;
}

@Injectable()
export class MerchantDashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/merchant/dashboard`;

  resumo(): Observable<DashboardResumoApi> {
    return this.http.get<DashboardResumoApi>(`${this.base}/resumo`);
  }
}
