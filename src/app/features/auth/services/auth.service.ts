import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface LoginResponse {
  token: string;
  refreshToken: string;
  role: string;
  tenantId: string;
  nomeLoja: string | null;
  slug: string | null;
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

interface JwtPayload {
  sub: string;
  tenantId?: string;
  role?: string;
  nomeLoja?: string;
  slug?: string;
  iat?: number;
  exp?: number;
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

  /**
   * Payload do JWT decodificado (base64) — reativo ao token.
   * Disponível imediatamente após login, sem nenhuma requisição extra.
   */
  readonly jwtPayload = computed<JwtPayload | null>(() => {
    const t = this._token();
    if (!t) return null;
    try {

      console.log(JSON.parse(atob(t.split('.')[1])))
      return JSON.parse(atob(t.split('.')[1])) as JwtPayload;
    } catch {
      return null;
    }
  });

  /** Nome da loja extraído diretamente do token JWT. */
  readonly nomeLoja = computed(() => this.jwtPayload()?.nomeLoja ?? null);

  /** Slug extraído diretamente do token JWT. */
  readonly slug = computed(() => this.jwtPayload()?.slug ?? null);

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
    // nomeLoja e slug são lidos do payload do próprio token — sem localStorage extra
  }
}
