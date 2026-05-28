import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { MerchantProfile } from '../models/merchant-profile.model';

export type { MerchantProfile };

@Injectable({ providedIn: 'root' })
export class MerchantMeService {
  private readonly http = inject(HttpClient);
  private readonly url  = `${environment.apiUrl}/api/v1/merchant/me`;

  getProfile(): Observable<MerchantProfile> {
    return this.http.get<MerchantProfile>(this.url);
  }
}
