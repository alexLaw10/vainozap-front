import { NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  type PedidoApi,
  STATUS_CONFIG,
  type StatusPedido,
} from '../../../models/order-api.model';
import { MerchantOrdersService } from '../../../services/merchant-orders.service';
import { TableComponent, type TableColumn, StatusMenuComponent, ToastService, SkeletonComponent } from '@app/shared/ui';

@Component({
  selector: 'app-merchant-order-detail-page',
  standalone: true,
  imports: [TableComponent, NgClass, RouterLink, StatusMenuComponent, SkeletonComponent],
  providers: [MerchantOrdersService],
  templateUrl: './merchant-order-detail-page.component.html',
  styleUrl: './merchant-order-detail-page.component.scss',
})
export class MerchantOrderDetailPageComponent implements OnInit {
  private readonly ordersService = inject(MerchantOrdersService);
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly toast         = inject(ToastService);

  protected readonly STATUS_CONFIG = STATUS_CONFIG;

  protected readonly linhaColumns: TableColumn[] = [
    { key: 'titulo',     header: 'Produto' },
    { key: 'quantidade', header: 'Qtd' },
    { key: 'precoUnit',  header: 'Unit.',    type: 'currency' },
    { key: 'subtotal',   header: 'Subtotal', type: 'currency',
      valueFn: (row) => row.quantidade * row.precoUnit },
  ];

  protected readonly pedido  = signal<PedidoApi | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving  = signal(false);
  protected readonly error   = signal<string | null>(null);

  protected readonly nextStatuses = computed<StatusPedido[]>(() => {
    const p = this.pedido();
    if (!p) return [];
    return STATUS_CONFIG[p.status]?.next ?? [];
  });

  protected readonly isTerminal = computed(() => this.nextStatuses().length === 0);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  private load(id: string): void {
    this.loading.set(true);
    this.ordersService.getById(id).subscribe({
      next:  (p) => { this.pedido.set(p); this.loading.set(false); },
      error: ()  => { this.loading.set(false); this.error.set('Pedido não encontrado.'); },
    });
  }

  protected moverStatus(status: StatusPedido): void {
    const p = this.pedido();
    if (!p || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.ordersService.updateStatus(p.id, status).subscribe({
      next: (updated) => {
        this.pedido.set(updated);
        this.saving.set(false);
        const label = STATUS_CONFIG[status]?.label ?? status;
        this.toast.show({ message: `Status atualizado para: ${label}` });
      },
      error: (e: { error?: { error?: string }; message?: string }) => {
        this.saving.set(false);
        this.error.set(e?.error?.error ?? e?.message ?? 'Erro ao atualizar status.');
      },
    });
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

  protected subtotalLinhas(): number {
    return (this.pedido()?.linhas ?? []).reduce(
      (acc, l) => acc + l.quantidade * l.precoUnit, 0,
    );
  }

  protected voltar(): void {
    void this.router.navigate(['/merchant/orders/pedidos']);
  }

  /** Label do botão de transição de status */
  protected nextLabel(status: StatusPedido): string {
    const labels: Record<StatusPedido, string> = {
      AGUARDANDO_PAGAMENTO: 'Aguardar pagamento',
      PAGAMENTO_NAO_EFETUADO: 'Marcar como não pago',
      NOVO: 'Confirmar pedido',
      EM_PREPARO: 'Iniciar preparo',
      ENVIADO: 'Marcar como enviado',
      ENTREGUE: 'Confirmar entrega',
      CANCELADO: 'Cancelar pedido',
    };
    return labels[status] ?? status;
  }

  /** Classe extra para botão de cancelar */
  protected nextBtnClass(status: StatusPedido): string {
    return status === 'CANCELADO' ? 'mcat-btn--danger-ghost' : 'mcat-btn--primary';
  }
}
