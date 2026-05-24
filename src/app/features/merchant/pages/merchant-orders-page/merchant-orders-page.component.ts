import { NgClass } from '@angular/common';
import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  ALL_STATUSES,
  type PedidoApi,
  STATUS_CONFIG,
  type StatusPedido,
} from '../../../../shared/models/order-api.model';
import type { PageResult } from '../../../../shared/models/page-result.model';
import { MerchantOrdersService } from '../../services/merchant-orders.service';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { PhoneMaskPipe } from '../../../../shared/pipes/phone-mask.pipe';

type Filtro = 'todos' | StatusPedido;

@Component({
  selector: 'app-merchant-orders-page',
  standalone: true,
  imports: [NgClass, FormsModule, RouterLink, PaginatorComponent, PhoneMaskPipe],
  providers: [MerchantOrdersService],
  templateUrl: './merchant-orders-page.component.html',
  styleUrl: './merchant-orders-page.component.scss',
})
export class MerchantOrdersPageComponent implements OnInit {
  private readonly orders = inject(MerchantOrdersService);

  protected readonly STATUS_CONFIG = STATUS_CONFIG;
  protected readonly ALL_STATUSES  = ALL_STATUSES;

  protected readonly pageResult = signal<PageResult<PedidoApi> | null>(null);
  protected readonly loading    = signal(false);
  protected readonly busca      = signal('');
  protected readonly filtro     = signal<Filtro>('todos');
  protected readonly curPage    = signal(0);
  protected readonly pageSize   = 20;

  // ── Inline status menu ───────────────────────────────────────────────────────
  /** ID do pedido com menu aberto, ou null. */
  protected readonly activeMenu = signal<string | null>(null);
  /** Posição fixed do menu (para quebrar fora do overflow da tabela). */
  protected readonly menuPos    = signal<{ top: number; left: number } | null>(null);
  /** ID do pedido sendo salvo inline. */
  protected readonly savingId   = signal<string | null>(null);

  // ── Drawer ──────────────────────────────────────────────────────────────────
  protected readonly drawerOpen    = signal(false);
  protected readonly selected      = signal<PedidoApi | null>(null);
  protected readonly saving        = signal(false);
  protected readonly saveError     = signal<string | null>(null);

  protected readonly nextStatuses = computed<StatusPedido[]>(() => {
    const p = this.selected();
    if (!p) return [];
    return STATUS_CONFIG[p.status]?.next ?? [];
  });

  protected readonly advanceStatuses = computed(() =>
    this.nextStatuses().filter(s => s !== 'CANCELADO' && s !== 'PAGAMENTO_NAO_EFETUADO')
  );

  protected readonly neutralStatuses = computed(() =>
    this.nextStatuses().filter(s => s === 'PAGAMENTO_NAO_EFETUADO')
  );

  protected readonly hasCancelAction = computed(() =>
    this.nextStatuses().includes('CANCELADO')
  );

  protected readonly isTerminal = computed(() =>
    this.nextStatuses().length === 0
  );

  // ── Derived signals (computed — reatividade garantida) ──────────────────────
  private  readonly list         = computed(() => this.pageResult()?.content ?? []);
  protected readonly totalElements = computed(() => this.pageResult()?.totalElements ?? 0);
  protected readonly totalPages    = computed(() => this.pageResult()?.totalPages ?? 0);

  protected readonly filtered = computed(() => {
    const q = this.busca().toLowerCase().trim();
    const items = this.list();
    if (!q) return items;
    return items.filter(p =>
      p.cliente?.nome?.toLowerCase().includes(q) ||
      p.cliente?.telefone?.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

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

  // ── Inline status menu ───────────────────────────────────────────────────────

  protected nextStatusesFor(pedido: PedidoApi): StatusPedido[] {
    return STATUS_CONFIG[pedido.status]?.next ?? [];
  }

  protected toggleMenu(pedido: PedidoApi, event: Event): void {
    event.stopPropagation();
    if (this.activeMenu() === pedido.id) {
      this.activeMenu.set(null);
      this.menuPos.set(null);
      return;
    }
    // Calcula posição fixed para quebrar fora do overflow da tabela
    const trigger = event.currentTarget as HTMLElement;
    const rect = trigger.getBoundingClientRect();
    this.menuPos.set({ top: rect.bottom + 6, left: rect.left });
    this.activeMenu.set(pedido.id);
  }

  protected closeMenu(): void {
    this.activeMenu.set(null);
    this.menuPos.set(null);
  }

  /** Salva o status inline com update otimista — badge muda na hora, reverte se der erro. */
  protected moverStatusInline(pedido: PedidoApi, status: StatusPedido, event: Event): void {
    event.stopPropagation();
    if (this.savingId() === pedido.id) return;

    this.activeMenu.set(null);
    this.menuPos.set(null);

    // Snapshot para rollback
    const snapshot = this.pageResult()?.content ?? [];

    // ── Atualização otimista: badge muda imediatamente ──
    this.patchStatus(pedido.id, status);
    this.savingId.set(pedido.id);

    this.orders.updateStatus(pedido.id, status).subscribe({
      next: (updated) => {
        // Confirma com dados reais do servidor
        this.patchStatus(updated.id, updated.status);
        if (this.selected()?.id === updated.id) this.selected.set(updated);
        this.savingId.set(null);
      },
      error: () => {
        // Reverte para o estado anterior
        const cur = this.pageResult();
        if (cur) this.pageResult.set({ ...cur, content: snapshot });
        this.savingId.set(null);
      },
    });
  }

  private patchStatus(id: string, newStatus: StatusPedido): void {
    const cur = this.pageResult();
    if (!cur) return;
    this.pageResult.set({
      ...cur,
      content: cur.content.map(o =>
        o.id === id ? { ...o, status: newStatus } : o
      ),
    });
  }

  /** Fecha o menu se clicar fora dele. */
  @HostListener('document:click')
  onDocumentClick(): void {
    this.activeMenu.set(null);
    this.menuPos.set(null);
  }

  // ── Drawer actions ───────────────────────────────────────────────────────────

  protected openDrawer(pedido: PedidoApi): void {
    this.selected.set(pedido);
    this.drawerOpen.set(true);
    this.saveError.set(null);
  }

  protected closeDrawer(): void {
    this.drawerOpen.set(false);
    setTimeout(() => this.selected.set(null), 260);
  }

  protected moverStatus(status: StatusPedido): void {
    const p = this.selected();
    if (!p || this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);

    this.orders.updateStatus(p.id, status).subscribe({
      next: (updated) => {
        const cur = this.pageResult();
        if (cur) {
          this.pageResult.set({
            ...cur,
            content: cur.content.map(o => o.id === updated.id ? updated : o),
          });
        }
        this.selected.set(updated);
        this.saving.set(false);

        if ((STATUS_CONFIG[updated.status]?.next ?? []).length === 0) {
          setTimeout(() => this.closeDrawer(), 900);
        }
      },
      error: (e: { error?: { error?: string }; message?: string }) => {
        this.saving.set(false);
        this.saveError.set(e?.error?.error ?? e?.message ?? 'Erro ao atualizar status.');
      },
    });
  }

  // ── Helpers de exibição ──────────────────────────────────────────────────────

  protected badgeClass(status: StatusPedido): string {
    return STATUS_CONFIG[status]?.colorClass ?? '';
  }

  protected statusLabel(status: StatusPedido): string {
    return STATUS_CONFIG[status]?.label ?? status;
  }

  protected actionLabel(status: StatusPedido): string {
    const labels: Record<StatusPedido, string> = {
      NOVO:                   'Confirmar pagamento',
      EM_PREPARO:             'Aceitar e iniciar preparo',
      ENVIADO:                'Marcar como enviado',
      ENTREGUE:               'Confirmar entrega',
      PAGAMENTO_NAO_EFETUADO: 'Pagamento não recebido',
      AGUARDANDO_PAGAMENTO:   'Aguardar pagamento',
      CANCELADO:              'Cancelar pedido',
    };
    return labels[status] ?? status;
  }

  /** Label curto para o menu inline (mais compacto). */
  protected actionLabelShort(status: StatusPedido): string {
    const labels: Record<StatusPedido, string> = {
      NOVO:                   'Confirmar pagamento',
      EM_PREPARO:             'Iniciar preparo',
      ENVIADO:                'Marcar enviado',
      ENTREGUE:               'Confirmar entrega',
      PAGAMENTO_NAO_EFETUADO: 'Pgto. não recebido',
      AGUARDANDO_PAGAMENTO:   'Aguardar pagamento',
      CANCELADO:              'Cancelar',
    };
    return labels[status] ?? status;
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  protected formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit',
    });
  }

  protected formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  protected shortId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }
}
