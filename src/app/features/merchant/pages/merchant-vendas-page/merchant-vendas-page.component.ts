import { Component, computed, inject, OnInit, signal } from '@angular/core';

import type { Periodo, TopProdutoApi, VendasResumoApi } from '../../../../shared/models/vendas-api.model';
import { MerchantVendasService } from '../../services/merchant-vendas.service';

@Component({
  selector: 'app-merchant-vendas-page',
  standalone: true,
  imports: [],
  providers: [MerchantVendasService],
  templateUrl: './merchant-vendas-page.component.html',
  styleUrl: './merchant-vendas-page.component.scss',
})
export class MerchantVendasPageComponent implements OnInit {
  private readonly vendasService = inject(MerchantVendasService);

  protected readonly PERIODOS: { value: Periodo; label: string }[] = [
    { value: '7d',  label: '7 dias'  },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
    { value: '12m', label: '12 meses'},
  ];

  protected readonly periodo  = signal<Periodo>('30d');
  protected readonly resumo   = signal<VendasResumoApi | null>(null);
  protected readonly loading  = signal(false);
  protected readonly error    = signal<string | null>(null);

  protected readonly maxReceita = computed(() => {
    const pp = this.resumo()?.porPeriodo ?? [];
    return Math.max(1, ...pp.map((d) => d.receita));
  });

  protected readonly topProdutoMax = computed(() => {
    const tp = this.resumo()?.topProdutos ?? [];
    return Math.max(1, ...tp.map((p) => p.receita));
  });

  ngOnInit(): void { this.load(); }

  protected setPeriodo(p: Periodo): void {
    this.periodo.set(p);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.vendasService.resumo(this.periodo()).subscribe({
      next:  (r) => { this.resumo.set(r); this.loading.set(false); },
      error: ()  => { this.loading.set(false); this.error.set('Erro ao carregar dados.'); },
    });
  }

  protected currency(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  protected barHeight(receita: number): number {
    return Math.max(2, Math.round((receita / this.maxReceita()) * 100));
  }

  protected barWidth(receita: number): number {
    return Math.max(2, Math.round((receita / this.topProdutoMax()) * 100));
  }

  protected formatLabel(data: string, granularidade: string): string {
    const d = new Date(data + 'T00:00:00Z');
    if (granularidade === 'MES') {
      return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' });
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
  }

  protected formatTooltip(item: { receita: number; pedidos: number }): string {
    return `${this.currency(item.receita)} · ${item.pedidos} ped.`;
  }

  protected trackByProduto(_: number, p: TopProdutoApi): string { return p.titulo; }
}
