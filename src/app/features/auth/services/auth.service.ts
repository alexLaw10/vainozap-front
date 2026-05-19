import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface LoginResponse {
  token: string;
  refreshToken: string;
  role: string;
  tenantId: string;
}

export interface RegisterData {
  nomeProprietario: string;
  email: string;
  senha: string;
  nomeLoja: string;
  slug: string;
  whatsapp: string;
  planoTipo: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY         = 'merchant_token';
  private readonly REFRESH_TOKEN_KEY = 'merchant_refresh_token';

  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/auth`;

  private readonly _token = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(this.TOKEN_KEY) : null,
  );

  readonly token           = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  get refreshToken(): string | null {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem(this.REFRESH_TOKEN_KEY)
      : null;
  }

  login(email: string, senha: string): Observable<void> {
    return this.http.post<LoginResponse>(`${this.base}/login`, { email, senha }).pipe(
      tap((res) => this.storeTokens(res)),
      map(() => void 0),
    );
  }

  register(data: RegisterData): Observable<void> {
    return this.http.post<LoginResponse>(`${this.base}/register`, data).pipe(
      tap((res) => this.storeTokens(res)),
      map(() => void 0),
    );
  }

  /** Troca o refresh token por um novo access token (chamado pelo interceptor). */
  refresh(): Observable<LoginResponse> {
    const refreshToken = this.refreshToken;
    return this.http
      .post<LoginResponse>(`${this.base}/refresh`, { refreshToken })
      .pipe(tap((res) => this.storeTokens(res)));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this._token.set(null);
  }

  storeTokens(res: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
    this._token.set(res.token);
  }
}
