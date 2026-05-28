import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent, SkeletonComponent } from '@app/shared/ui';
import { AuthService } from '../../../../auth/services/auth.service';
import { StorefrontContextService } from '../../../../storefront/services/storefront-context.service';
import { environment } from '../../../../../../environments/environment';
import { MerchantCatalogService } from '../../../services/merchant-catalog.service';
import { MerchantContextService } from '../../../services/merchant-context.service';
import {
  DashboardResumoApi,
  MerchantDashboardService,
} from '../../../services/merchant-dashboard.service';

export interface OnboardingStep {
  label: string;
  done: boolean;
  link?: string;
  linkLabel?: string;
  external?: boolean;
}

@Component({
  selector: 'app-merchant-dashboard-page',
  standalone: true,
  imports: [RouterLink, IconComponent, SkeletonComponent],
  providers: [MerchantDashboardService, MerchantCatalogService],
  templateUrl: './merchant-dashboard-page.component.html',
  styleUrl: './merchant-dashboard-page.component.scss',
})
export class MerchantDashboardPageComponent implements OnInit {
  protected readonly ctx         = inject(MerchantContextService);
  private readonly auth          = inject(AuthService);
  private readonly sfContext     = inject(StorefrontContextService);
  private readonly dashService   = inject(MerchantDashboardService);
  private readonly catalog       = inject(MerchantCatalogService);

  protected readonly saudacao = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  protected readonly resumo      = signal<DashboardResumoApi | null>(null);
  protected readonly loading     = signal(true);
  protected readonly hasProdutos = signal(false);

  /** URL pública da vitrine deste lojista. */
  protected readonly vitrineUrl = computed<string | null>(() => {
    const slug = this.auth.slug();
    if (!slug) return null;
    return `https://${slug}${environment.domainSuffix}`;
  });

  /** Passos dinâmicos do onboarding — cada um verifica o estado real. */
  protected readonly onboardingSteps = computed<OnboardingStep[]>(() => {
    const whatsapp = this.sfContext.tenant().whatsapp;
    const r        = this.resumo();
    const temVenda = ((r?.pedidosHoje ?? 0) + (r?.vendasMes ?? 0)) > 0;

    return [
      {
        label: 'Conta criada',
        done:  true,
      },
      {
        label:     'Configure as informações da loja',
        done:      !!whatsapp,
        link:      '/merchant/loja/configurar',
        linkLabel: 'Configurar agora →',
      },
      {
        label:     'Adicione seu primeiro produto',
        done:      this.hasProdutos(),
        link:      '/merchant/loja/cadastrar/produtos',
        linkLabel: 'Adicionar produto →',
      },
      {
        label:     'Receba seu primeiro pedido',
        done:      temVenda,
        link:      this.vitrineUrl() ?? undefined,
        linkLabel: 'Compartilhar vitrine →',
        external:  true,
      },
    ];
  });

  protected readonly onboardingDoneCount = computed(() =>
    this.onboardingSteps().filter(s => s.done).length
  );

  protected readonly onboardingProgress = computed(() =>
    Math.round(this.onboardingDoneCount() / this.onboardingSteps().length * 100)
  );

  /** Exibe o checklist enquanto há passos pendentes. */
  protected readonly showOnboarding = computed(() =>
    !this.loading() && this.onboardingDoneCount() < this.onboardingSteps().length
  );

  ngOnInit(): void {
    this.dashService.resumo().subscribe({
      next:  (r) => { this.resumo.set(r); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });

    // Verifica se o lojista já tem produtos cadastrados
    this.catalog.listProducts(0, 1).subscribe({
      next: (page) => this.hasProdutos.set(page.totalElements > 0),
    });
  }

  protected currency(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
