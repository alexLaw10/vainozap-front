import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

import { MerchantCatalogService } from '../../services/merchant-catalog.service';
import { MerchantContextService } from '../../services/merchant-context.service';
import { MerchantDashboardService } from '../../services/merchant-dashboard.service';
import { PanelThemeService } from '../../services/panel-theme.service';
import { TrialBannerComponent } from '../trial-banner/trial-banner.component';
import { UpgradeModalComponent } from '../upgrade-modal/upgrade-modal.component';
import { AuthService } from '../../../auth/services/auth.service';
import { IconComponent, ToastComponent } from '@app/shared/ui';
import { MerchantNotificationBellComponent } from '../notification-bell/notification-bell.component';
import { environment } from '../../../../../environments/environment';
import type { MerchantSubNavItem } from '../../models/nav.model';

@Component({
  selector: 'app-merchant-shell',
  standalone: true,
  imports: [RouterLink, RouterOutlet, MerchantNotificationBellComponent, IconComponent, ToastComponent, UpgradeModalComponent, TrialBannerComponent],
  templateUrl: './merchant-shell.component.html',
  styleUrl: './merchant-shell.component.scss',
  providers: [MerchantContextService, MerchantCatalogService, MerchantDashboardService],
})
export class MerchantShellComponent implements OnInit {
  protected readonly ctx = inject(MerchantContextService);
  protected readonly panelTheme = inject(PanelThemeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dashService = inject(MerchantDashboardService);

  /** Pedidos pendentes para o badge da sidebar. */
  protected readonly pedidosPendentes = signal(0);

  /** URL da vitrine pública do lojista — abre em nova aba. */
  protected readonly vitrineUrl = computed(() => {
    const slug = this.auth.slug();
    if (!slug) return null;
    return `${window.location.protocol}//${slug}${environment.domainSuffix}`;
  });

  protected readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    inject(Title).setTitle('Área do lojista');
  }

  ngOnInit(): void {
    this.dashService.resumo().subscribe({
      next: (r) => this.pedidosPendentes.set(r.pedidosPendentes),
    });
  }

  protected isTab(tab: 'loja' | 'pedidos' | 'contas'): boolean {
    const u = this.currentUrl().split('?')[0];
    switch (tab) {
      case 'loja':
        return u.startsWith('/merchant/loja');
      case 'pedidos':
        return u.startsWith('/merchant/orders');
      case 'contas':
        return u.startsWith('/merchant/contas');
      default:
        return false;
    }
  }

  protected readonly lojaSubNavPrimary = computed((): MerchantSubNavItem[] => [
    { path: '/merchant/loja/vitrine', label: 'Vitrine' },
    { path: '/merchant/loja/cadastrar/produtos', label: 'Cadastrar' },
    { path: '/merchant/loja/configurar', label: 'Configurar' },
    { path: '/merchant/loja/gerenciar/produtos', label: 'Gerenciar' },
  ]);

  protected readonly lojaSubNavSecondary = computed((): MerchantSubNavItem[] => {
    const u = this.currentUrl().split('?')[0];
    if (u.startsWith('/merchant/loja/cadastrar')) {
      return [
        { path: '/merchant/loja/cadastrar/produtos', label: 'Produtos' },
        { path: '/merchant/loja/cadastrar/variacoes', label: 'Variações' },
        { path: '/merchant/loja/cadastrar/categorias', label: 'Categorias' },
      ];
    }
    if (u.startsWith('/merchant/loja/gerenciar')) {
      return [
        { path: '/merchant/loja/gerenciar/produtos', label: 'Produtos' },
        { path: '/merchant/loja/gerenciar/estoque', label: 'Estoque' },
        { path: '/merchant/loja/gerenciar/cupons', label: 'Cupons' },
        // NÃO IMPLEMENTADO: { path: '/merchant/loja/gerenciar/interessados', label: 'Interessados' },
      ];
    }
    return [];
  });

  protected readonly showLojaSubPrimary = computed(() => {
    const u = this.currentUrl().split('?')[0];
    return u.startsWith('/merchant/loja');
  });

  protected readonly showLojaSubSecondary = computed(() => this.lojaSubNavSecondary().length > 0);

  protected readonly lojaDetailSectionTitle = computed(() => {
    const u = this.currentUrl().split('?')[0];
    if (u.startsWith('/merchant/loja/cadastrar')) return 'Cadastrar';
    if (u.startsWith('/merchant/loja/gerenciar')) return 'Gerenciar';
    return '';
  });

  protected lojaPrimaryActive(path: string): boolean {
    const u = this.currentUrl().split('?')[0];
    if (path.endsWith('/vitrine')) return u.startsWith('/merchant/loja/vitrine');
    if (path.includes('/cadastrar')) return u.startsWith('/merchant/loja/cadastrar');
    if (path.includes('/configurar')) return u === '/merchant/loja/configurar';
    if (path.includes('/gerenciar')) return u.startsWith('/merchant/loja/gerenciar');
    return false;
  }

  protected lojaSecondaryActive(item: MerchantSubNavItem): boolean {
    return this.currentUrl().split('?')[0] === item.path;
  }
}
