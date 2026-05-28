import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, map, tap, throwError } from 'rxjs';

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
  planoTipo?: string;
  assinaturaStatus?: string;
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

  // ── Concurrent-refresh guard ─────────────────────────────────────────────────
  /**
   * Subject ativo apenas enquanto um refresh está em voo.
   * null = nenhum refresh em andamento.
   * Requisições que chegam enquanto o refresh está ativo assinam este Subject:
   *  - Se refresh OK  → next(token)  + complete()   — todas recebem o token
   *  - Se refresh FAIL → error(err)                 — todas recebem o erro e
   *                                                   o interceptor faz logout
   */
  private _refreshSubject: Subject<string> | null = null;

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
      return JSON.parse(atob(t.split('.')[1])) as JwtPayload;
    } catch {
      return null;
    }
  });

  /** Nome da loja extraído diretamente do token JWT. */
  readonly nomeLoja = computed(() => this.jwtPayload()?.nomeLoja ?? null);

  /** Slug extraído diretamente do token JWT. */
  readonly slug = computed(() => this.jwtPayload()?.slug ?? null);

  /** Plano do tenant extraído diretamente do JWT — disponível sem requisição extra. */
  readonly planoTipo = computed(() =>
    (this.jwtPayload()?.planoTipo ?? 'basico') as 'basico' | 'profissional' | 'business'
  );

  /** Status da assinatura extraído do JWT — trial | ativa | inadimplente | cancelada. */
  readonly assinaturaStatus = computed(() =>
    (this.jwtPayload()?.assinaturaStatus ?? 'ativa') as 'trial' | 'ativa' | 'inadimplente' | 'cancelada'
  );

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

  /**
   * Garante que apenas UMA chamada a /auth/refresh seja feita por vez.
   *
   * - Se não há refresh em andamento: dispara a requisição e cria um Subject
   *   compartilhado. Quando conclui, emite next(token)/complete() ou error(err)
   *   para TODAS as requisições que estiverem aguardando.
   * - Se já há um refresh em andamento: assina o Subject existente e aguarda
   *   o resultado — sem fazer nova requisição.
   *
   * Em caso de falha, TODAS as chamadas em espera recebem o erro, permitindo
   * que o interceptor de cada uma execute logout + redirect corretamente.
   */
  refreshOnce(): Observable<string> {
    // Já há um refresh em andamento — encadeia na mesma resposta
    if (this._refreshSubject) {
      return this._refreshSubject.asObservable();
    }

    // Inicia novo refresh
    this._refreshSubject = new Subject<string>();
    const subject = this._refreshSubject;

    const rt = this.refreshToken;
    return this.http
      .post<LoginResponse>(`${this.base}/refresh`, { refreshToken: rt })
      .pipe(
        tap((res) => {
          this.storeTokens(res);
          subject.next(res.token);   // desbloqueia todas as requisições em fila
          subject.complete();
          this._refreshSubject = null;
        }),
        map((res) => res.token),
        catchError((err) => {
          subject.error(err);        // propaga erro para todas as requisições em fila
          this._refreshSubject = null;
          return throwError(() => err);
        }),
      );
  }

  /** @internal Troca o refresh token por um novo access token (raw, sem guard). */
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
