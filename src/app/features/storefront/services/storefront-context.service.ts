import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { TENANT_MOCK } from '../../../mock/tenant.mock';
import type { Tenant, TenantRodape } from '../../../core/models/tenant.model';
import type { TenantApi } from '../../../core/models/tenant-api.model';

/** Tenant neutro usado como valor inicial — evita que dados mock (PaceFit) apareçam
 *  antes da resposta real da API. */
const TENANT_EMPTY: Tenant = {
  id: '',
  slug: '',
  nomeLoja: '',
  logoUrl: null,
  faviconUrl: null,
  corPrimaria: '#7c3aed',
  corSecundaria: '#22c55e',
  whatsapp: '',
  planoTipo: 'basico',
  assinaturaStatus: 'ativa',
  ativo: true,
  rodape: {
    textoLinkWhatsapp: 'Falar no WhatsApp',
    seloTitulo: '',
    seloSubtitulo: '',
    reclamacoesTexto: null,
    reclamacoesUrl: null,
    formasPagamento: [],
    redesSociais: [],
    redesPlaceholder: '',
    faixaInferior: '',
  },
};

/** Lê o slug do payload JWT no localStorage — sem depender do AuthService. */
function slugFromToken(): string | null {
  try {
    const token = localStorage.getItem('merchant_token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.slug ?? null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class StorefrontContextService {
  private readonly http = inject(HttpClient);
  private readonly doc  = inject(DOCUMENT);

  readonly tenant = signal<Tenant>(TENANT_EMPTY);
  readonly loaded = signal(false);

  constructor() {
    // Aplica as CSS vars de cor sempre que o tenant mudar —
    // funciona tanto na vitrine pública (Shell) quanto na pré-visualização do merchant.
    effect(() => {
      const t    = this.tenant();
      const root = this.doc.documentElement;
      root.style.setProperty('--color-primary',            t.corPrimaria);
      root.style.setProperty('--color-secondary',          t.corSecundaria);
      root.style.setProperty(
        '--color-destaque-catalogo',
        t.corDestaqueCatalogo ?? t.corPrimaria,
      );
    });
  }

  load(): Observable<void> {
    if (environment.useMock) {
      // Modo dev com mock: usa dados completos da PaceFit para testes visuais
      this.tenant.set(TENANT_MOCK);
      this.loaded.set(true);
      return of(void 0);
    }

    const slug = this.resolveSlug();
    if (!slug) {
      console.warn('[StorefrontContext] Slug não encontrado, usando mock.');
      this.loaded.set(true);
      return of(void 0);
    }

    return this.http.get<TenantApi>(`${environment.apiUrl}/api/v1/stores/slug/${slug}`).pipe(
      tap((t) => this.setTenantFromApi(t)),   // setTenantFromApi já faz loaded.set(true)
      catchError((err) => {
        console.warn('[StorefrontContext] Backend indisponível, usando dados básicos.', err);
        this.loaded.set(true);
        return of(null);
      }),
      map(() => void 0),
    );
  }

  /**
   * Atualiza o contexto com os dados do lojista autenticado (TenantApi → Tenant).
   * Usado pelo MerchantContextService para garantir isolamento total:
   * o merchant nunca vê dados de outro tenant, mesmo que o APP_INITIALIZER
   * tenha carregado outro storefront antes do login.
   */
  setTenantFromApi(t: TenantApi): void {
    const rodape: TenantRodape = {
      textoLinkWhatsapp:  t.rodape?.textoLinkWhatsapp ?? 'Falar no WhatsApp',
      seloTitulo:         t.rodape?.seloTitulo        ?? 'Compra segura',
      seloSubtitulo:      t.rodape?.seloSubtitulo     ?? '',
      reclamacoesTexto:   t.rodape?.reclamacoesTexto  ?? null,
      reclamacoesUrl:     t.rodape?.reclamacoesUrl    ?? null,
      formasPagamento:    t.rodape?.formasPagamento   ?? [],
      redesSociais:       t.rodape?.redesSociais      ?? [],
      redesPlaceholder:   t.rodape?.redesPlaceholder  ?? '',
      faixaInferior:      t.rodape?.faixaInferior     ?? '',
    };

    this.tenant.set({
      id:                         t.id,
      slug:                       t.slug,
      nomeLoja:                   t.nomeLoja,
      tituloDocumento:            t.tituloDocumento       ?? undefined,
      logoUrl:                    t.logoUrl,
      faviconUrl:                 t.faviconUrl,
      bannerUrl:                  t.bannerUrl ?? null,
      corPrimaria:                t.corPrimaria           ?? '#7c3aed',
      corSecundaria:              t.corSecundaria         ?? '#22c55e',
      corDestaqueCatalogo:        t.corDestaqueCatalogo   ?? undefined,
      whatsapp:                   t.whatsapp              ?? '',
      planoTipo:                  t.planoTipo             as Tenant['planoTipo'],
      assinaturaStatus:           (t.assinaturaStatus     as Tenant['assinaturaStatus']) ?? 'ativa',
      ativo:                      t.ativo,
      slogan:                     t.slogan                ?? undefined,
      emailContato:               t.emailContato          ?? undefined,
      telefoneContato:            t.telefoneContato       ?? undefined,
      horarioAtendimentoLinha:    t.horarioAtendimentoLinha    ?? undefined,
      horarioAtendimentoDetalhes: t.horarioAtendimentoDetalhes ?? undefined,
      cnpj:                       t.cnpj                  ?? undefined,
      nomeProprietario:           t.nomeProprietario      ?? undefined,
      enderecoLinha:              t.enderecoLinha         ?? undefined,
      mensagemTopo:               t.mensagemTopo          ?? null,
      corFundoTopo:               t.corFundoTopo          ?? null,
      politicaEntregaLinha:       t.politicaEntregaLinha  ?? null,
      rodape,
    });
    this.loaded.set(true);
  }

  private resolveSlug(): string | null {
    const hostname = window.location.hostname;
    // Produção: extrai slug do subdomínio (ex: minha-loja.vainozap.com.br → minha-loja)
    if (hostname.endsWith(environment.domainSuffix)) {
      return hostname.slice(0, -environment.domainSuffix.length);
    }
    // Dev local: usa slug do JWT (se o usuário já estiver logado)
    const fromToken = slugFromToken();
    if (fromToken) return fromToken;
    // Fallback: slug fixo no environment (opcional, pode ficar vazio)
    return environment.devTenantSlug || null;
  }
}
