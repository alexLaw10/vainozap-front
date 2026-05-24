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

  update(
    settings: Omit<TenantApi, 'id' | 'planoTipo' | 'ativo' | 'trialEndsAt'>,
    files?: { logo?: File; favicon?: File; banner?: File },
  ): Observable<TenantApi> {
    const fd = new FormData();
    // Envia a parte JSON com Content-Type explícito para que o Spring
    // consiga desserializar o @RequestPart("settings") corretamente.
    fd.append('settings', new Blob([JSON.stringify(settings)], { type: 'application/json' }));
    if (files?.logo)    fd.append('logo',    files.logo);
    if (files?.favicon) fd.append('favicon', files.favicon);
    if (files?.banner)  fd.append('banner',  files.banner);
    return this.http.put<TenantApi>(this.base, fd);
  }
}
