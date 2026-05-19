import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { MerchantContextService } from '../../services/merchant-context.service';
import {
  DashboardResumoApi,
  MerchantDashboardService,
} from '../../services/merchant-dashboard.service';

@Component({
  selector: 'app-merchant-dashboard-page',
  standalone: true,
  imports: [RouterLink, IconComponent],
  providers: [MerchantDashboardService],
  templateUrl: './merchant-dashboard-page.component.html',
  styleUrl: './merchant-dashboard-page.component.scss',
})
export class MerchantDashboardPageComponent implements OnInit {
  protected readonly ctx = inject(MerchantContextService);
  private readonly dashService = inject(MerchantDashboardService);

  protected readonly saudacao = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  });

  protected readonly resumo   = signal<DashboardResumoApi | null>(null);
  protected readonly loading  = signal(true);

  ngOnInit(): void {
    this.dashService.resumo().subscribe({
      next:  (r) => { this.resumo.set(r); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  protected currency(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
