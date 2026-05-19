import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { TENANT_MOCK } from '../../../mock/tenant.mock';
import type { Tenant, TenantRodape } from '../../../shared/models/tenant.model';
import type { TenantApi } from '../../../shared/models/tenant-api.model';

@Injectable({ providedIn: 'root' })
export class StorefrontContextService {
  private readonly http = inject(HttpClient);

  readonly tenant = signal<Tenant>(TENANT_MOCK);
  readonly loaded = signal(false);

  load(): Observable<void> {
    if (environment.useMock) {
      this.loaded.set(true);
      return of(void 0);
    }

    const slug = this.resolveSlug();
    if (!slug) {
      console.warn('[StorefrontContext] Slug não encontrado, usando mock.');
      this.loaded.set(true);
      return of(void 0);
    }

    return this.http.get<Tenant>(`${environment.apiUrl}/api/v1/stores/slug/${slug}`).pipe(
      tap((tenant) => {
        this.tenant.set(tenant);
        this.loaded.set(true);
      }),
      catchError((err) => {
        console.warn('[StorefrontContext] Backend indisponível, usando mock.', err);
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
      corPrimaria:                t.corPrimaria           ?? '#16a34a',
      corSecundaria:              t.corSecundaria         ?? '#ffffff',
      corDestaqueCatalogo:        t.corDestaqueCatalogo   ?? undefined,
      whatsapp:                   t.whatsapp              ?? '',
      planoTipo:                  t.planoTipo             as Tenant['planoTipo'],
      ativo:                      t.ativo,
      slogan:                     t.slogan                ?? undefined,
      emailContato:               t.emailContato          ?? undefined,
      telefoneContato:            t.telefoneContato       ?? undefined,
      horarioAtendimentoLinha:    t.horarioAtendimentoLinha    ?? undefined,
      horarioAtendimentoDetalhes: t.horarioAtendimentoDetalhes ?? undefined,
      cnpj:                       t.cnpj                  ?? undefined,
      nomeProprietario:           t.nomeProprietario      ?? undefined,
      enderecoLinha:              t.enderecoLinha         ?? undefined,
      rodape,
    });
    this.loaded.set(true);
  }

  private resolveSlug(): string | null {
    const hostname = window.location.hostname;
    if (hostname.endsWith(environment.domainSuffix)) {
      return hostname.slice(0, -environment.domainSuffix.length);
    }
    return environment.devTenantSlug;
  }
}
