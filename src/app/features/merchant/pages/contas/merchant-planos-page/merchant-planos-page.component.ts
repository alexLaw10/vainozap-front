import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../../../../environments/environment';
import { SkeletonComponent } from '@app/shared/ui';
import { PlanoContextService } from '../../../services/plano-context.service';
import { BillingService } from '../../../services/billing.service';

export interface PlanoLimites {
  maxLojas: number;
  maxFotos: number;
  maxOperadores: number;
  janelaRelatoriosDias: number;
}

export interface PlanoFeatures {
  cupons: boolean;
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
  suportePrioritario: boolean;
}

export interface PlanoApi {
  tipo: string;
  nome: string;
  descricao: string;
  precoMensal: number;
  precoAnual: number;
  destaque: boolean;
  limites: PlanoLimites;
  features: PlanoFeatures;
  destaquesBullets: string[];
}

@Component({
  selector: 'app-merchant-planos-page',
  standalone: true,
  imports: [CurrencyPipe, SkeletonComponent],
  templateUrl: './merchant-planos-page.component.html',
  styleUrl: './merchant-planos-page.component.scss',
})
export class MerchantPlanosPageComponent {
  protected readonly billingEnabled = environment.billingEnabled;

  private readonly billing = inject(BillingService);
  private readonly router  = inject(Router);
  protected readonly plano = inject(PlanoContextService);

  protected readonly planos      = signal<PlanoApi[]>([]);
  protected readonly loading     = signal(true);
  protected readonly erro        = signal<string | null>(null);
  protected readonly ctaLoading  = signal<string | null>(null); // tipo do plano em processamento

  protected readonly planoAtual = computed(() => this.plano.planoTipo());

  protected preco(p: PlanoApi): number {
    return p.precoMensal;
  }

  protected limiteLabel(valor: number): string {
    return valor === -1 ? 'Ilimitado' : String(valor);
  }

  protected isAtual(tipo: string): boolean {
    return this.planoAtual() === tipo;
  }

  protected isUpgrade(tipo: string): boolean {
    const ordem: Record<string, number> = { basico: 0, profissional: 1, business: 2 };
    return (ordem[tipo] ?? 0) > (ordem[this.planoAtual()] ?? 0);
  }

  protected isDowngrade(tipo: string): boolean {
    const ordem: Record<string, number> = { basico: 0, profissional: 1, business: 2 };
    return (ordem[tipo] ?? 0) < (ordem[this.planoAtual()] ?? 0);
  }

  protected ctaLabel(tipo: string): string {
    if (this.ctaLoading() === tipo) return 'Aguarde…';
    if (this.isAtual(tipo))        return 'Plano atual';
    if (this.isUpgrade(tipo))      return 'Fazer upgrade';
    return 'Fazer downgrade';
  }

  /**
   * Inicia o checkout no Asaas.
   * Abre a URL de pagamento em nova aba e aguarda confirmação via webhook.
   */
  protected onCta(p: PlanoApi): void {
    if (this.isAtual(p.tipo) || this.ctaLoading()) return;
    if (!environment.billingEnabled) {
      this.erro.set('Cobrança temporariamente indisponível. Entre em contato com o suporte.');
      return;
    }

    this.ctaLoading.set(p.tipo);
    this.erro.set(null);

    this.billing.checkout({
      planoTipo: p.tipo as 'basico' | 'profissional' | 'business',
      ciclo: 'MONTHLY',
    }).subscribe({
      next: (res) => {
        this.ctaLoading.set(null);
        // Abre a fatura Asaas (boleto/PIX) em nova aba e aguarda confirmação
        window.open(res.checkoutUrl, '_blank', 'noopener,noreferrer');
        void this.router.navigate(['/merchant/contas/checkout-pendente']);
      },
      error: (err: { error?: { detail?: string } }) => {
        this.ctaLoading.set(null);
        this.erro.set(
          err?.error?.detail ?? 'Não foi possível iniciar o pagamento. Tente novamente.'
        );
      },
    });
  }

  constructor() {
    this.loading.set(false);
  }
}
