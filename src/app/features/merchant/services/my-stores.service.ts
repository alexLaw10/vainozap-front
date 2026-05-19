import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import type { LoginResponse } from '../../auth/services/auth.service';

export interface MinhaLojaDto {
  tenantId: string;
  slug: string;
  nomeLoja: string;
  logoUrl: string | null;
  planoTipo: string;
  papel: string;
  isPrimary: boolean;
}

export interface NovaLojaRequest {
  nomeLoja: string;
  slug: string;
  whatsapp: string;
}

@Injectable({ providedIn: 'root' })
export class MyStoresService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/merchant/my-stores`;

  listar(): Observable<MinhaLojaDto[]> {
    return this.http.get<MinhaLojaDto[]>(this.base);
  }

  criar(req: NovaLojaRequest): Observable<MinhaLojaDto> {
    return this.http.post<MinhaLojaDto>(this.base, req);
  }

  switch(tenantId: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/${tenantId}/switch`, {});
  }
}
