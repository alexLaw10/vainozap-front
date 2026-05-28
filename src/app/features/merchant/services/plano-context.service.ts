import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';
import type { TenantPlanoTipo } from '../../../core/models/tenant.model';

export interface AssinaturaDetalhe {
  planoTipo: string;
  status: string;
  trialAtivo: boolean;
  diasRestantesTrial: number;
  trialEndsAt: string | null;
}

/**
 * Fonte única de verdade para feature flags de plano no painel do lojista.
 *
 * Leitura:
 *  - `planoTipo` + `assinaturaStatus` vêm do AuthService (JWT, síncronos, zero requests)
 *  - `diasRestantesTrial` + `trialEndsAt` vêm de /api/v1/merchant/assinatura (lazy, 1x)
 *
 * Uso:
 *  - `if (plano.temVideos()) { ... }`
 *  - `[disabled]="!plano.temPixel()"`
 *  - `*ngIf="plano.isTrial()"`
 */
@Injectable({ providedIn: 'root' })
export class PlanoContextService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly url  = `${environment.apiUrl}/api/v1/merchant/assinatura`;

  // ── Estado interno do detalhe da assinatura (carregado lazy) ─────────────
  private readonly _detalhe = signal<AssinaturaDetalhe | null>(null);
  private readonly _detalheFetched = signal(false);

  constructor() {
    // Carrega detalhe da assinatura assim que o usuário estiver autenticado
    // Converte o signal para Observable para poder usar filter + takeUntilDestroyed
    toObservable(this.auth.isAuthenticated).pipe(
      filter(Boolean),
      takeUntilDestroyed(),
    ).subscribe(() => this.carregarDetalhe());
  }

  // ── Plano e status (direto do JWT — síncronos) ────────────────────────────

  /** Tipo do plano: basico | profissional | business */
  readonly planoTipo = computed<TenantPlanoTipo>(() => this.auth.planoTipo());

  /** Status da assinatura: trial | ativa | inadimplente | cancelada */
  readonly status = computed(() => this.auth.assinaturaStatus());

  // ── Computed de status ───────────────────────────────────────────────────

  readonly isTrial       = computed(() => this.status() === 'trial');
  readonly isAtiva       = computed(() => this.status() === 'ativa');
  readonly isInadimplente = computed(() => this.status() === 'inadimplente');
  readonly isCancelada   = computed(() => this.status() === 'cancelada');

  /** true quando a conta está ativa para uso (trial válido ou assinatura ativa) */
  readonly isAcessoValido = computed(() =>
    this.status() === 'ativa' || this.status() === 'trial'
  );

  // ── Detalhe do trial (vem da API, lazy) ──────────────────────────────────

  readonly diasRestantesTrial = computed(() =>
    this._detalhe()?.diasRestantesTrial ?? 0
  );

  readonly trialEndsAt = computed(() =>
    this._detalhe()?.trialEndsAt ? new Date(this._detalhe()!.trialEndsAt!) : null
  );

  /** true quando o detalhe da assinatura já foi carregado da API. */
  readonly detalheCarregado = computed(() => this._detalhe() !== null);

  // ── Feature flags — Básico ───────────────────────────────────────────────

  readonly temCupons   = computed(() => true); // todos os planos têm
  readonly temEstoque  = computed(() => true); // todos os planos têm
  readonly temVariacoes = computed(() => true); // todos os planos têm

  // ── Feature flags — Profissional+ ────────────────────────────────────────

  readonly temVideos = computed(() =>
    this._isProfissionalOuMais()
  );

  readonly temPixel = computed(() =>
    this._isProfissionalOuMais()
  );

  readonly temInstagramShopping = computed(() =>
    this._isProfissionalOuMais()
  );

  readonly temCalculoFrete = computed(() =>
    this._isProfissionalOuMais()
  );

  readonly temDominioProprio = computed(() =>
    this._isProfissionalOuMais()
  );

  readonly temTemplatesWhatsapp = computed(() =>
    this._isProfissionalOuMais()
  );

  readonly temAgendamentoPromocoes = computed(() =>
    this._isProfissionalOuMais()
  );

  readonly temAviseMe = computed(() =>
    this._isProfissionalOuMais()
  );

  readonly maxFotos = computed(() => {
    const p = this.planoTipo();
    if (p === 'basico') return 10;
    return -1; // ilimitado
  });

  readonly maxOperadores = computed(() => {
    const p = this.planoTipo();
    if (p === 'basico')       return 0;
    if (p === 'profissional') return 3;
    return -1; // ilimitado
  });

  // ── Feature flags — Business ─────────────────────────────────────────────

  readonly temRecuperacaoCarrinho = computed(() =>
    this.planoTipo() === 'business'
  );

  readonly temLoginCliente = computed(() =>
    this.planoTipo() === 'business'
  );

  readonly temApiWebhook = computed(() =>
    this.planoTipo() === 'business'
  );

  readonly temAvaliacaoProduto = computed(() =>
    this.planoTipo() === 'business'
  );

  readonly temMultiplasLojas = computed(() =>
    this.planoTipo() === 'business'
  );

  readonly maxLojas = computed(() => {
    if (this.planoTipo() === 'business') return 3;
    return 1;
  });

  // ── Helper genérico ───────────────────────────────────────────────────────

  /**
   * Verifica se o plano atual tem acesso a uma feature pelo nome.
   * Útil para guards e diretivas que recebem o nome como string.
   */
  temFeature(feature: keyof PlanoFeatures): boolean {
    const map: PlanoFeatures = {
      cupons:               this.temCupons(),
      estoque:              this.temEstoque(),
      variacoes:            this.temVariacoes(),
      videos:               this.temVideos(),
      pixel:                this.temPixel(),
      instagramShopping:    this.temInstagramShopping(),
      calculoFrete:         this.temCalculoFrete(),
      dominioProprio:       this.temDominioProprio(),
      templatesWhatsapp:    this.temTemplatesWhatsapp(),
      agendamentoPromocoes: this.temAgendamentoPromocoes(),
      aviseMe:              this.temAviseMe(),
      recuperacaoCarrinho:  this.temRecuperacaoCarrinho(),
      loginCliente:         this.temLoginCliente(),
      apiWebhook:           this.temApiWebhook(),
      avaliacaoProduto:     this.temAvaliacaoProduto(),
      multiplasLojas:       this.temMultiplasLojas(),
    };
    return map[feature] ?? false;
  }

  /** Força recarga do detalhe da assinatura (ex: após upgrade). */
  recarregar(): void {
    this._detalheFetched.set(false);
    this.carregarDetalhe();
  }

  // ── Privados ─────────────────────────────────────────────────────────────

  private _isProfissionalOuMais(): boolean {
    const p = this.planoTipo();
    return p === 'profissional' || p === 'business';
  }

  private carregarDetalhe(): void {
    if (this._detalheFetched()) return;
    this._detalheFetched.set(true);

    this.http.get<AssinaturaDetalhe>(this.url).subscribe({
      next: (d) => this._detalhe.set(d),
      error: () => { /* silencioso — JWT é suficiente para feature flags */ },
    });
  }
}

/** Mapa de nomes de features para uso em diretivas e guards. */
export type PlanoFeatures = {
  cupons: boolean;
  estoque: boolean;
  variacoes: boolean;
  videos: boolean;
  pixel: boolean;
  instagramShopping: boolean;
  calculoFrete: boolean;
  dominioProprio: boolean;
  templatesWhatsapp: boolean;
  agendamentoPromocoes: boolean;
  aviseMe: boolean;
  recuperacaoCarrinho: boolean;
  loginCliente: boolean;
  apiWebhook: boolean;
  avaliacaoProduto: boolean;
  multiplasLojas: boolean;
};
