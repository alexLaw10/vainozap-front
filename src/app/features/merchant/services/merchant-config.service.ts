import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { TenantApi } from '../../../shared/models/tenant-api.model';

@Injectable()
export class MerchantConfigService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/merchant/settings`;

  get(): Observable<TenantApi> {
    return this.http.get<TenantApi>(this.base);
  }

  update(settings: Omit<TenantApi, 'id' | 'planoTipo' | 'ativo' | 'trialEndsAt'>): Observable<TenantApi> {
    return this.http.put<TenantApi>(this.base, settings);
  }
}
