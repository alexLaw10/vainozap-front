import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { AtualizarStatusApi, PedidoApi, StatusPedido } from '../models/order-api.model';
import type { PageResult } from '../models/page-result.model';

@Injectable()
export class MerchantOrdersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/merchant/orders`;

  listPage(page = 0, size = 20, status?: StatusPedido): Observable<PageResult<PedidoApi>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<PageResult<PedidoApi>>(this.base, { params });
  }

  getById(id: string): Observable<PedidoApi> {
    return this.http.get<PedidoApi>(`${this.base}/${id}`);
  }

  updateStatus(id: string, status: StatusPedido): Observable<PedidoApi> {
    const body: AtualizarStatusApi = { status };
    return this.http.patch<PedidoApi>(`${this.base}/${id}/status`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
