import { NgClass } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  ALL_STATUSES,
  type PedidoApi,
  STATUS_CONFIG,
  type StatusPedido,
} from '../../../../shared/models/order-api.model';
import type { PageResult } from '../../../../shared/models/page-result.model';
import { MerchantOrdersService } from '../../services/merchant-orders.service';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';

type Filtro = 'todos' | StatusPedido;

@Component({
  selector: 'app-merchant-orders-page',
  standalone: true,
  imports: [NgClass, FormsModule, RouterLink, PaginatorComponent],
  providers: [MerchantOrdersService],
  templateUrl: './merchant-orders-page.component.html',
  styleUrl: './merchant-orders-page.component.scss',
})
export class MerchantOrdersPageComponent implements OnInit {
  private readonly orders = inject(MerchantOrdersService);
  private readonly router = inject(Router);

  protected readonly STATUS_CONFIG = STATUS_CONFIG;
  protected readonly ALL_STATUSES  = ALL_STATUSES;

  protected readonly pageResult = signal<PageResult<PedidoApi> | null>(null);
  protected readonly loading    = signal(false);
  protected readonly busca      = signal('');
  protected readonly filtro     = signal<Filtro>('todos');
  protected readonly curPage    = signal(0);
  protected readonly pageSize   = 20;

  /** Atalhos para o template. */
  protected list()         { return this.pageResult()?.content ?? []; }
  protected totalElements(){ return this.pageResult()?.totalElements ?? 0; }
  protected totalPages()   { return this.pageResult()?.totalPages ?? 0; }

  /** Filtragem local por busca (nome/telefone/id) — aplicada sobre a página atual. */
  protected filtered() {
    const q = this.busca().toLowerCase().trim();
    if (!q) return this.list();
    return this.list().filter((p) =>
      p.cliente?.nome?.toLowerCase().includes(q) ||
      p.cliente?.telefone?.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  }

  /** Contagem por status (na página atual — informativa). */
  protected countFor(s: StatusPedido): number {
    return this.list().filter((p) => p.status === s).length;
  }

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    const status = this.filtro() === 'todos' ? undefined : this.filtro() as StatusPedido;
    this.orders.listPage(this.curPage(), this.pageSize, status).subscribe({
      next:  (res) => { this.pageResult.set(res); this.loading.set(false); },
      error: ()    => this.loading.set(false),
    });
  }

  protected setFiltro(f: Filtro): void {
    this.filtro.set(f);
    this.curPage.set(0);
    this.load();
  }

  protected onPageChange(page: number): void {
    this.curPage.set(page);
    this.load();
  }

  protected goDetail(id: string): void {
    void this.router.navigate(['/merchant/orders/pedidos', id]);
  }

  protected badgeClass(status: StatusPedido): string {
    return STATUS_CONFIG[status]?.colorClass ?? '';
  }

  protected statusLabel(status: StatusPedido): string {
    return STATUS_CONFIG[status]?.label ?? status;
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  protected formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
