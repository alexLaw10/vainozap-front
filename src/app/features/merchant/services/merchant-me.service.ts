import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface MerchantProfile {
  email: string;
  nomeProprietario: string | null;
  telefone: string | null;
  planoTipo: string;
  trialEndsAt: string | null;  // ISO-8601 LocalDateTime from backend
}

@Injectable({ providedIn: 'root' })
export class MerchantMeService {
  private readonly http = inject(HttpClient);
  private readonly url  = `${environment.apiUrl}/api/v1/merchant/me`;

  getProfile(): Observable<MerchantProfile> {
    return this.http.get<MerchantProfile>(this.url);
  }
}
