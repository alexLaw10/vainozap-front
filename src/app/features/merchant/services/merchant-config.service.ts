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
    files?: { logoFile?: File; faviconFile?: File; bannerFile?: File },
  ): Observable<TenantApi> {
    const fd = new FormData();
    fd.append('settings', JSON.stringify(settings));
    if (files?.logoFile)    fd.append('logoFile',    files.logoFile);
    if (files?.faviconFile) fd.append('faviconFile', files.faviconFile);
    if (files?.bannerFile)  fd.append('bannerFile',  files.bannerFile);
    return this.http.put<TenantApi>(this.base, fd);
  }
}
