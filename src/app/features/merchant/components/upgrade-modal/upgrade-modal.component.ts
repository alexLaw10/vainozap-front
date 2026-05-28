import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { UpgradeModalService } from '../../services/upgrade-modal.service';
import { PlanoContextService } from '../../services/plano-context.service';
import { TENANT_PLANO_UI } from '../../../../core/models/tenant.model';

/** Mapa: feature → plano mínimo necessário */
const FEATURE_PLANO_MINIMO: Record<string, 'profissional' | 'business'> = {
  videos:               'profissional',
  pixel:                'profissional',
  instagramShopping:    'profissional',
  calculoFrete:         'profissional',
  dominioProprio:       'profissional',
  templatesWhatsapp:    'profissional',
  agendamentoPromocoes: 'profissional',
  aviseMe:              'profissional',
  recuperacaoCarrinho:  'business',
  loginCliente:         'business',
  apiWebhook:           'business',
  avaliacaoProduto:     'business',
  multiplasLojas:       'business',
};

@Component({
  selector: 'app-upgrade-modal',
  standalone: true,
  template: `
    @if (state().open) {
      <!-- Backdrop -->
      <div
        class="upgrade-backdrop"
        (click)="fechar()"
        (keydown.escape)="fechar()"
        tabindex="-1"
        aria-hidden="true"
      ></div>

      <!-- Modal -->
      <div class="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
        <button class="upgrade-modal__close" type="button" aria-label="Fechar" (click)="fechar()">✕</button>

        <div class="upgrade-modal__icon">🚀</div>

        <h2 class="upgrade-modal__title" id="upgrade-title">
          {{ titulo() }}
        </h2>

        <p class="upgrade-modal__desc">
          {{ descricao() }}
        </p>

        <!-- Plano mínimo necessário destacado -->
        @if (planoMinimo()) {
          <div class="upgrade-modal__plano-badge" [style.border-color]="corPlano()">
            <span class="upgrade-modal__plano-nome" [style.color]="corPlano()">
              {{ nomePlano() }}
            </span>
            <span class="upgrade-modal__plano-preco">
              R$ {{ precoPlano() }}/mês
            </span>
          </div>
        }

        <div class="upgrade-modal__actions">
          <button
            class="upgrade-modal__btn upgrade-modal__btn--primary"
            type="button"
            (click)="irParaPlanos()"
          >
            Ver planos e preços
          </button>
          <button
            class="upgrade-modal__btn upgrade-modal__btn--ghost"
            type="button"
            (click)="fechar()"
          >
            Agora não
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './upgrade-modal.component.scss',
})
export class UpgradeModalComponent {
  private readonly router  = inject(Router);
  protected readonly svc   = inject(UpgradeModalService);
  protected readonly plano = inject(PlanoContextService);

  protected readonly state = this.svc.state;

  protected readonly planoMinimo = computed(() => {
    const f = this.state().feature;
    return f ? (FEATURE_PLANO_MINIMO[f] ?? null) : null;
  });

  protected readonly nomePlano = computed(() => {
    const p = this.planoMinimo();
    return p ? TENANT_PLANO_UI[p].tituloCard : '';
  });

  protected readonly corPlano = computed(() => {
    const p = this.planoMinimo();
    return p ? TENANT_PLANO_UI[p].corDestaque : '#7c3aed';
  });

  protected readonly precoPlano = computed(() => {
    const p = this.planoMinimo();
    return p ? TENANT_PLANO_UI[p].precoMensal.toFixed(2).replace('.', ',') : '';
  });

  protected readonly titulo = computed(() => {
    const p = this.planoMinimo();
    if (p === 'business') return 'Recurso exclusivo Business';
    if (p === 'profissional') return 'Recurso exclusivo Profissional';
    return 'Faça upgrade do seu plano';
  });

  protected readonly descricao = computed(() => {
    const msg = this.state().mensagem;
    if (msg) return msg;
    const p = this.planoMinimo();
    if (p === 'business')
      return 'Este recurso está disponível no Plano Business. Faça upgrade para desbloquear automações avançadas, múltiplas lojas e muito mais.';
    if (p === 'profissional')
      return 'Este recurso está disponível no Plano Profissional. Faça upgrade para desbloquear pixel, vídeos, domínio próprio e mais.';
    return 'Faça upgrade para desbloquear este recurso e levar sua loja ao próximo nível.';
  });

  protected fechar(): void {
    this.svc.fechar();
  }

  protected irParaPlanos(): void {
    this.svc.fechar();
    void this.router.navigateByUrl('/merchant/contas/planos');
  }
}
